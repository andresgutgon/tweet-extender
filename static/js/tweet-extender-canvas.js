'use strict';

var default_font_size = 21;

/*
 * Get longest word in the text
 *
 * @param {String} text
 * @return {String}
 */
function longestWord(text) {
  var words = text.split(' ');
  return _.reduce(words, function (a, b) {
    return a.length > b.length ? a : b;
  });
}

/*
 * Process each line of text
 *
 * @param {String} line
 * @param {CanvasContext} context
 * @param {Integer} x
 * @param {Integer} y
 * @param {Integer} maxWidth
 * @param {Integer} lineHeight
 * @return {Integer}
 */
function proccessLine(line, context, x, y, maxWidth, lineHeight) {
  var words
    , n;

  // line = line.replace(/{newLine}/g, '');
  words = line.split(' ')

  for (n = 0; n < words.length; n++) {
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

  return y;
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
  var sections
    , len
    , longest_word
    , longest_word_length
    , s;

  text = text.replace(/(\r\n|\n\r|\r|\n)/g, '\n');
  longest_word = longestWord(text);
  longest_word_length = context.measureText(longest_word);

  while(longest_word_length.width > maxWidth) {
    default_font_size --;
    context.font = generateFontStyle(default_font_size);
    longest_word_length = context.measureText(longest_word);
  }

  lineHeight = default_font_size + 2;

  sections = text.split('\n');
  _.each(sections, function (line) {
    y += lineHeight;
    y = proccessLine(line, context, x, y, maxWidth, lineHeight);
    y += lineHeight;
  });

  if (context.canvas.height < y) {
    context.canvas.height = y;
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
 * Generate canvas font style
 *
 * @param {Integer} size
 * @param {String}
 */
function generateFontStyle(size) {
  var font_weigth = '200'
    , font_size = size ? size : default_font_size
    , font_size_string = font_size + 'px'
    , font_family = '"Helvetica Neue",Helvetica,Arial,sans-serif';

  return [font_weigth, font_size_string, font_family].join(' ');
}
/*
 * Manage user input on textarea
 *
 * @param {String} text
 * @param {Integer} count
 */
function renderExtraText (text, count) {
  var slice_text = ''
    , slice_text_end
    , canvas = document.getElementById('tweet-canvas')
    , context = canvas.getContext('2d')
    , canvas_width = $(canvas).parent().width()
    , maxWidth
    , lineHeight = 24
    , x_pos
    , y_pos = 15;

  canvas.width = canvas_width;
  // sets maximum line width, line height, and x /y coords for text
  maxWidth = canvas.width - 20;
  x_pos = (canvas.width - maxWidth) / 2;

  context.font = generateFontStyle();
  context.fillStyle = '#333';

  if (count > MAX_TWEET_LENGTH) {
    slice_text_end = getExtraTextPosition(text);
    slice_text = text.slice(slice_text_end, count);
    slice_text = '... ' + slice_text;
  }

  textToImage(context, slice_text, x_pos, y_pos, maxWidth, lineHeight);
}

renderExtraText = _.debounce(renderExtraText, 300);
