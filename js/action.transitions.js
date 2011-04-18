Action.addTransition({
  type: 'in',
  name: 'Slide In',
  build: function (video) {
    var $video = $(video);
    return function (callback) {
      $video.show();
      $video.css({ left:window.innerWidth/2 - video.videoWidth/2, 
                   top:-video.videoHeight});
      $video.transform({rotate: '-30deg'});
      $video.animate({
        rotate: '0deg',
        top: window.innerHeight/2 - video.videoHeight/2 
      }, 1000, callback);
    };
  },
});

Action.addTransition({
  type: 'out',
  name: 'Slide Out',
  build: function (video) {
    var $video = $(video);
    return function (callback) {
      $video.animate({
        rotate: '30deg',
        top: window.innerHeight + video.videoHeight 
      }, 1000, function() {
        $video.hide();
        if (callback) {
          callback();
        } //if
      });
    };
  },
});

Action.addTransition({
  type: 'in',
  name: 'Fade In',
  build: function (video) {
    var $video = $(video);
    return function (callback) {
      $video.css({ left:window.innerWidth/2 - video.videoWidth/2, 
                   top:window.innerHeight/2 - video.videoHeight/2});
      $video.css('opacity', 0);
      $video.show();
      $video.fadeTo(1000, 1);
    };
  },
});

Action.addTransition({
  type: 'out',
  name: 'Fade Out',
  build: function (video) {
    var $video = $(video);
    return function (callback) {
      $video.fadeTo(1000, 0);
      setTimeout(function() {
        $video.hide();
        if (callback) {
          callback();
        } //if
      }, 1000);
    };
  },
});

