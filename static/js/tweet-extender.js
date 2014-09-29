/*
 * function to clear the canvas
 * @param {DOM} canvas_element
 */
function clearCanvas(canvas_element) {
  var context = canvas_element.getContext('2d');
  context.beginPath();
  context.save();

  // Use the identity matrix while clearing the canvas
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas_element.width, canvas_element.height);
  context.restore();
}

/*
 * Calculate carriage return of text and max with before
 * write the text in the canvas
 *
 * @param {CanvasContext} context
 * @param {String} text
 * @param {Integer} x
 * @param {Integer} y
 * @param {Integer} maxWidth
 * @param {Integer} lineHeight
 */
function wrapText(context, text, x, y, maxWidth, lineHeight) {
  text = text.replace(/(\r\n|\n\r|\r|\n)/g, "\n");
  var sections = text.split("\n");

  for (s = 0, len = sections.length; s < len; s++) {
      var words = sections[s].split(' ')
        , line = '';

      for (var n = 0; n < words.length; n++) {
        if (n === 0) {
          y += lineHeight;
        };

        var testLine = line + words[n] + ' '
          , metrics = context.measureText(testLine)
          , testWidth = metrics.width;

        if (testWidth > maxWidth) {
          context.fillText(line, x, y);
          line = words[n] + ' ';
          y += lineHeight;
        } else {
          line = testLine;
        }
      }

      context.fillText(line, x, y);

     //new line for new section of the text
     y += lineHeight;

     if (context.canvas.height < y) {
      context.canvas.height = y;
     }
  }


}

/*
 * Get the position in tweet where valid text ends
 *
 * @param {String} text
 */
function getExtraTextPosition(text) {
  return _.reduce(text.match(/\S+/g), function(memo, word) {
    if (memo.length < MAX_TWEET_LENGTH) {
      return memo + ' ' + word;
    } else {
      return memo;
    }
  }, '').length;
}

/*
 * Parse text, replace br by \n\r
 *
 * @param {jQuery} element
 * @return {Integer}
 */
function parseText(element) {
  var text = element.html()
  text = text.replace(/(<br>)|(<br \/>)/g, "\r\n");

  return $('<div />').html(text).text();
}

/*
 * Convert base64/URLEncoded data component
 * to raw binary data held in a string
 *
 * @param {String} dataURI
 * @return {Blob}
 */
function dataURItoBlob(dataURI) {
  var byteString;
  if (dataURI.split(',')[0].indexOf('base64') >= 0) {
    byteString = atob(dataURI.split(',')[1]);
  } else {
    byteString = unescape(dataURI.split(',')[1]);
  }

  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

  // write the bytes of the string to a typed array
  var ia = new Uint8Array(byteString.length);
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ia], {type:mimeString});
}

/* Returns contents of a canvas as
 * a png based data url, with the specified
 * background color
 *
 * param {DOM} canvas
 * param {String} backgroundColor
 */
function canvasToImage(canvas, backgroundColor) {
  var w = canvas.width
    , h = canvas.height
    , context = canvas.getContext('2d')
    , compositeOperation;

  var data;

  if(backgroundColor) {
    //get the current ImageData for the canvas.
    data = context.getImageData(0, 0, w, h);
    //store the current globalCompositeOperation
    compositeOperation = context.globalCompositeOperation;
    //set to draw behind current content
    context.globalCompositeOperation = "destination-over";
    //set background color
    context.fillStyle = backgroundColor;
    //draw background / rect on entire canvas
    context.fillRect(0,0,w,h);
  }

  //get the image data from the canvas
  var imageData = canvas.toDataURL("image/png");

  if(backgroundColor) {
    context.clearRect (0,0,w,h);
    context.putImageData(data, 0,0);
    context.globalCompositeOperation = compositeOperation;
  }

  //return the Base64 encoded data url string
  return imageData;
}

var TEXT_LENGHT_FOR_ATTACHED_IMAGE = 40
, TWEET_LENGTH = 140
, MAX_TWEET_LENGTH = TWEET_LENGTH - TEXT_LENGHT_FOR_ATTACHED_IMAGE;

$('.js-tweet-content').on('change keyup', function () {
  var text
    , slice_text
    , slice_text_end
    , count
    , canvas = document.getElementById('tweet-canvas')
    , context = canvas.getContext('2d')
    , maxWidth
    , lineHeight = 24
    , x_pos
    , y_pos = 15;

  text = parseText($(this));
  count = window.twttr.txt.getTweetLength(text)

  $('.js-counter').text(count);
  $('.js-button').attr('disabled', !count);

  // sets maximum line width, line height, and x /y coords for text
  maxWidth = canvas.width - 20;
  x_pos = (canvas.width - maxWidth) / 2;

  context.font = '200 21px "Helvetica Neue",Helvetica,Arial,sans-serif';
  context.fillStyle = '#333';

  clearCanvas(canvas);

  $('.js-explanation').toggleClass('js-hide', count > MAX_TWEET_LENGTH);

  if (count > MAX_TWEET_LENGTH) {
    slice_text_end = getExtraTextPosition(text);
    slice_text = text.slice(slice_text_end, count);
    slice_text = slice_text.replace(/^\s+/gm,'');
    wrapText(context, slice_text, x_pos, y_pos, maxWidth, lineHeight);
  }
}).change();

$('.js-tweet-form').on('submit', function (event) {
  event.preventDefault();
  event.stopPropagation();

  var data
    , count
    , text
    , slice_text_end
    , canvas = document.getElementById('tweet-canvas')
    , context = canvas.getContext('2d')
    , blob
    , form_data = new FormData(this)
    , tweet_text;

  text = parseText($('.js-tweet-content'));
  count = window.twttr.txt.getTweetLength(text)
  slice_text_end = getExtraTextPosition(text);
  tweet_text = text.slice(0, slice_text_end - 1);

  form_data.append('valid_tweet_text', tweet_text)

  if (count > MAX_TWEET_LENGTH) {
    form_data.append('valid_tweet_text', tweet_text  + '...')
    image = canvasToImage(canvas, '#f9f9f9');
    blob = dataURItoBlob(image);
    form_data.append("embeded_image", blob);
  };

  $.ajax({
      url: '/publish'
    , method: 'POST'
    , data: form_data
    , contentType: false
    , processData: false
    , success: function () {
      window.location = '/';
    }
  })
});


$(function () {
  setTimeout(function () {
    $('.js-alert').remove();
  }, 2000);
});
