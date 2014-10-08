'use strict';

var TEXT_LENGHT_FOR_ATTACHED_IMAGE = 40
, TWEET_LENGTH = 140
, MAX_TWEET_LENGTH = TWEET_LENGTH - TEXT_LENGHT_FOR_ATTACHED_IMAGE
, $tweet_textarea = $('.js-tweet-content');

/*
 * Convert base64/URLEncoded data component
 * to raw binary data held in a string
 *
 * @param {String} dataURI
 * @return {Blob}
 */
function dataURItoBlob(dataURI) {
  var byteString
  , ia
  , mimeString;

  if (dataURI.split(',')[0].indexOf('base64') >= 0) {
    byteString = atob(dataURI.split(',')[1]);
  } else {
    byteString = unescape(dataURI.split(',')[1]);
  }

  // separate out the mime component
  mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

  // write the bytes of the string to a typed array
  ia = new Uint8Array(byteString.length);
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ia], {type:mimeString});
}

/*
 * Get the position in tweet where valid text ends.
 * this method counts the number of spaces and carriage returns
 *
 * @param {String} text
 * @return {Integer}
 */
function getExtraTextPosition(text) {
  var text_with_carriage_return = text.replace(/[\n|\n\r|\r]/gm,'{newChar}')
  var text_with_no_space = text.replace(/\s/gm,' {Space} ')
    , memo_text
    , memo_text_with_returns
    , memotext_plus_return_count
    , return_count = 0
    , count = 0;

  return _.reduce(text_with_no_space.match(/\S+/g), function(memo, word) {
    if (memo < MAX_TWEET_LENGTH) {
      if (word.match(/^{Space}$/mg)) {
        return memo + 1;
      } else if (word.match(/^{newChar}$/mg)) {
        return memo + 2;
      } else {
        if (memo > 0) {
          return memo + word.length;
        } else {
          return word.length;
        }
      }
    } else {
      return memo;
    }

  }, 0);
}

/*
 * Get form data
 *
 * @return {FormData}
 */
function getFormData(text) {
  var data
    , image
    , count
    , text = $tweet_textarea.val()
    , slice_text_end
    , canvas = document.getElementById('tweet-canvas')
    , context = canvas.getContext('2d')
    , blob
    , form_data = new FormData(this)
    , tweet_text;

  count = window.twttr.txt.getTweetLength(text)
  slice_text_end = getExtraTextPosition(text);
  tweet_text = text.slice(0, slice_text_end - 1);

  form_data.append('valid_tweet_text', tweet_text)

  if (count > MAX_TWEET_LENGTH) {
    form_data.append('valid_tweet_text', tweet_text  + '...')
    image = generateImageForTweet(canvas, '#f9f9f9');
    blob = dataURItoBlob(image);
    form_data.append("embeded_image", blob);
  };

  return form_data;
}

/*
 * Document loaded
 */
$(function () {

  /*
   * Listen to user input in keyboard
   */
  $tweet_textarea.on('change keyup', function () {
    var text = $tweet_textarea.val()
      , count;

    count = window.twttr.txt.getTweetLength(text)

    $('.js-counter').text(count);
    $('.js-button').attr('disabled', !count);
    onUserKeyUp(text, count);
  }).change();

  /*
   * Handle form submit
   */
  $('.js-tweet-form').on('submit', function (event) {
    event.preventDefault();
    event.stopPropagation();

    var form_data = getFormData();

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

  /*
   * Clear flash message
   */
  setTimeout(function () {
    $('.js-alert').remove();
  }, 2000);
});
