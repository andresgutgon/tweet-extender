'use strict';

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
function textToImage(context, text, x, y, maxWidth, lineHeight) {
  var sections = text.split('\n')
    , len
    , s;

  sections;

  text = text.replace(/(\r\n|\n\r|\r|\n)/g, '\n');

  for (s = 0, len = sections.length; s < len; s++) {
    var words = sections[s].split(' ')
      , n
      , line = '';

    for (n = 0; n < words.length; n++) {
      if (n === 0) {
        y += lineHeight;
      }

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

/* Returns contents of a canvas as
 * a png based data url, with the specified
 * background color
 *
 * param {DOM} canvas
 * param {String} backgroundColor
 */
function generateImageForTweet(canvas, backgroundColor) {
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

/*
 * Manage user input on textarea
 *
 * @param {String} text
 * @param {Integer} count
 */
function onUserKeyUp (text, count) {
  var slice_text
    , slice_text_end
    , canvas = document.getElementById('tweet-canvas')
    , context = canvas.getContext('2d')
    , maxWidth
    , lineHeight = 24
    , x_pos
    , y_pos = 15;

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
    textToImage(context, slice_text, x_pos, y_pos, maxWidth, lineHeight);
  }
}
