$(document).ready( function (e) {

  var sections = [],
      currentSection,
      currentSectionIndex,
      targetUUID = 0,
      $win = $(window),
      savedItems = JSON.parse(localStorage.getItem('Action')),
      edit = window.location.href.indexOf('?edit');

  savedItems = savedItems || [];

  (function() {
    var spinnerCanvas = document.getElementById('spinner-canvas'),
        ctx = spinnerCanvas.getContext('2d'),
        numPieces = 8,
        indexStep = 4,
        spinnerInterval,
        w = spinnerCanvas.width/2;
        spinnerIndex = 0;

    ctx.clearRect(0, 0, spinnerCanvas.width, spinnerCanvas.height);
    ctx.translate(spinnerCanvas.width/2, spinnerCanvas.height/2);
    ctx.fillStyle = '#aaa';
    for (var i=0; i<numPieces; ++i) {
      ctx.save();
      ctx.rotate(Math.PI*2/numPieces*i);
      ctx.translate(w/4, w/4);
      ctx.beginPath();
      ctx.arc(0, 0, w/8, w/8, 0, Math.PI*2, true);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } //for

    $('#spinner-div').dialog({
      width: 300,
      autoOpen: false,
      closeOnEscape: false,
      draggable: false,
      resizable: false,
      modal: true,
      stack: true,
      open: function (e, ui) {
        $('.ui-dialog-titlebar-close').hide();
        spinnerInterval = setInterval( function() {
          spinnerIndex += indexStep;
          $('#spinner-canvas').css('rotate', spinnerIndex+'deg');
        }, 30);
      },
      close: function (e) {
        clearInterval(spinnerInterval);
      },
    });
  })();

  $('#edit-menu-videos').sortable({
    placeholder: "ui-state-highlight"
  });

  $('#edit-menu').disableSelection();
  $('#edit-menu-videos').disableSelection();

  $('#edit-menu-videos').bind('sortupdate', function ( event, ui ) {
    newSections = [];
    var vids = $(this).sortable('toArray');
    for (var i=0; i<vids.length; ++i) {
      var vidId = vids[i].substr(vids[i].indexOf('-')+1);
      for (var j=0; j<sections.length; ++j) {
        if (vidId === sections[j].video.id) {
          newSections.push(sections[j]);
          break;
        } //if 
      } //for
    } //for
    sections = newSections;
  });

  Popcorn.plugin('test', function (options) {
    return {
      _setup: function (options) {
      },
      start: function (event, options) {
        $('#'+options.target).html('Test!');
      },
      end: function (event, options) {
        $('#'+options.target).html('');
      }
    };
  });

  Popcorn.plugin('animator', function (options) {
    return {
      _setup: function (options) {
      },
      start: function (event, options) {
      },
      end: function (event, options) {
      }
    };
  });

  $('#edit-menu-link-add').click( function(e) {
    $('#dialog-add-video-name').val('Untitled '+sections.length);
    $('#dialog-add').dialog('open');
  });

  function playLastSection() {
    stopCurrentSection();
    $('#controls-next').hide();
    $('#controls-last').hide();
    var index = sections.indexOf(currentSection);
    playSection(sections[index-1]);
  }

  function playNextSection() {
    stopCurrentSection();
    $('#controls-next').hide();
    $('#controls-last').hide();
    var index = sections.indexOf(currentSection);
    playSection(sections[index+1]);
  }

  function stopCurrentSection() {
    if (currentSection) {
      currentSection.popcorn.pause();
      currentSection.hide();
      currentSection.$li.removeClass('bold');
    } //if
  }; //stopCurrentSection

  function playSection (section) {
    if (section) {
      function play() {
        section.popcorn.currentTime(0);
        section.show();
        section.popcorn.play();
        section.transitionIn();
        section.$li.addClass('bold');
      }; //play

      currentSection = section;

      if (section.ready) {
        play();
      }
      else {
        $('#spinner-div').dialog('open');
        $(section.video).bind('loadedmetadata', function (ev) {
          $('#spinner-div').dialog('close');
          play();
        });
      } //if
    } //if
  }; //playSection

  function toggleEditMode(toggle) {
    if (toggle) {
      $('#edit-menu').parent().show();
      $('#modes-view').show();
      $('#modes-edit').hide();
      $('.container').draggable();
      $('.container').resizable();
    }
    else {
      $('#edit-menu').parent().hide();
      $('#modes-view').hide();
      $('#modes-edit').show();
      $('.container').draggable('destroy');
      $('.container').resizable('destroy');
    } //if
  }; //toggleEditMode

  function buildVideo(videoUrl, popcornSrc, transitionIn, transitionOut, videoName) {
    var video = document.createElement('video'),
        $video,
        videoSource = document.createElement('source');

    function setVideoPosition(options) {
      $video.css(options);
    }; //setVideoPosition

    var transitions = {
      slideIn: function (callback) {
        $video.show();
        setVideoPosition({ left:window.innerWidth/2 - video.videoWidth/2, 
                          top:-video.videoHeight});
        $video.transform({rotate: '-30deg'});
        $video.animate({
          rotate: '0deg',
          top: window.innerHeight/2 - video.videoHeight/2 
        }, 1000, callback);

      },
      slideOut: function (callback) {
        $video.animate({
          rotate: '30deg',
          top: window.innerHeight + video.videoHeight 
        }, 1000, function() {
          $video.hide();
          if (callback) {
            callback();
          } //if
        });
      },
      fadeIn: function (callback) {
        setVideoPosition({ left:window.innerWidth/2 - video.videoWidth/2, 
                          top:window.innerHeight/2 - video.videoHeight/2});
        $video.css('opacity', 0);
        $video.show();
        $video.fadeTo(1000, 1);
       
      },
      fadeOut: function (callback) {
        $video.fadeTo(1000, 0);
        setTimeout(function() {
          $video.hide();
          if (callback) {
            callback();
          } //if
        }, 1000);
      },
      defaultIn: function (callback) {
        $video.show();
        setVideoPosition({ left:window.innerWidth/2 - video.videoWidth/2, 
                          top:window.innerHeight/2 - video.videoHeight/2});
        if (callback) { 
          callback();
        } //if
      },
      defaultOut: function (callback) {
        $video.hide();
        if (callback) { 
          callback();
        } //if
      },
    };

    var plugins = [];
    var popcornDivs = [];
    var pluginInstances = popcornSrc.match(/\.\w*\(\{([\s\w'"]*:\s?[\s"'\w]*,\s?)*["|']?target["|']?:["|'][\w\-]*["|']/gi);
    var targetRegex = /[\s"']*target[\s"']*:\s?["|'](.*)["|']\s?/;
    var pluginRegex = /\.(\w*)\(\{/;
    for (var i=0; i<pluginInstances.length; ++i) {
      var instance = pluginInstances[i];
      var targetName = instance.match(targetRegex)[1];
      var pluginName = instance.match(pluginRegex)[1];
      if (plugins[pluginName]) {
        continue;
      } //if
      plugins[pluginName] = true;
      var newTarget = 'popcorn-target-' + pluginName + '-' + targetUUID;
      var re = new RegExp(targetName, "gi");
      popcornSrc = popcornSrc.replace(re, newTarget);
      var title = $('<h3 />');
      title.html(pluginName);
      title.addClass('ui-widget-header');
      var $div = $('<div/>');
      var rx = -50 + Math.random() * 100;
      var ry = -50 + Math.random() * 100;
      $div.attr('id', newTarget + '-ui')
        .addClass('ui-widget-content')
        .addClass('container')
        .draggable()
        .css('z-index', 30)
        .resizable()
        .css('position', 'absolute')
        .offset({left:window.innerWidth - $div.width() - 20 + rx, top: 100 + ry});
      $div.append(title);
      var content = $('<div/>');
      content.attr('id', newTarget);
      $div.append(content);
      popcornDivs.push($div);
      $('#containers').append($div);
      var originalBackground = $div.css('background-color');
      $div.contextMenu('plugin-context-menu', {
        menuStyle: {
          width: '150px',
        },
        onShowMenu: function (e, menu) {
          return menu;
        },
        bindings: {
          'plugin-context-menu-transparency': function (t) {
            var $elem = $(t);
            $elem.css('background-color', 'transparent');
          },
          'plugin-context-menu-opaque': function (t) {
            var $elem = $(t);
            $elem.css('background-color', originalBackground);
          },
        },
      });
      ++targetUUID;
    } //for

    var popcornFunc = new Function(popcornSrc);

    videoSource.src = videoUrl;
    video.appendChild(videoSource); 
    video.id = 'video';
    video.setAttribute('controls', true);
    video.setAttribute('autobuffer', true);
    video.setAttribute('preload', 'auto');
    video.style.zIndex = 20;

    $('#videos').append(video);
    $video = $(video);

    try {

      //Should bail right here if popcorn is bad
      popcornFunc();

      video.id = 'video' + sections.length;

      var popcorn = Popcorn.instances[Popcorn.instances.length-1];

      var $li = $('<li id="list-'+video.id+'"></li>');
      var $a = $('<a id="a-'+video.id+'">'+ videoName +'</a>');

      $a.appendTo($li);

     $('#edit-menu-videos').append($li);

      if (currentSection) {
        stopCurrentSection();
        currentSection.$li.removeClass('bold');
      } //if

      $li.addClass('bold');

      var section = {
        video: video,
        transitionIn: transitions[transitionIn],
        transitionOut: transitions[transitionOut],
        popcorn: popcorn,
        popcornSrc: popcornSrc,
        name: videoName,
        popcornDivs: popcornDivs,
        $li: $li,
        ready: false, 
        show: function () {
          for (var i=0; i<popcornDivs.length; ++i) {
            $(popcornDivs[i]).show();
          } //for
        },
        hide: function () {
          $video.hide();
          for (var i=0; i<popcornDivs.length; ++i) {
            $(popcornDivs[i]).hide();
          } //for
        },
        getReplica: function () {
          return {
            video: video.currentSrc,
            transitionIn: transitionIn,
            transitionOut: transitionOut,
            popcornSrc: popcornSrc,
            name: videoName,
          }
        },
      };

      currentSection = section;
      sections.push(section);

      $a.click( function (e) {
        stopCurrentSection();
        playSection(section);
      });

      $(video).bind('loadedmetadata', function (ev) {
        section.ready = true;
      });

      popcorn.listen('ended', function (ev) {
        if (sections.indexOf(currentSection) < sections.length -1) {
          $('#controls-next').fadeTo(150, 1);
        }
        if (sections.indexOf(currentSection) > 0) {
          $('#controls-last').fadeTo(150, 1);
        }
      });

      $video.css('position', 'absolute');
      section.hide();
      playSection(section);
      return true;
    }
    catch (error) {

      for (var i=0; i<popcornDivs.length; ++i) {
        $(popcornDivs[i]).remove();
      } //for

      $(video).remove();
      return false;

    } //catch

  }; //buildVideo

  (function() {
    var fields = $([]).add($('#dialog-add-video-url')).add($('#dialog-add-popcorn'));
    $('#dialog-add').dialog({

      autoOpen: false,
      height: 500,
      width: 700,
      modal: true,

      buttons: {

        "Insert" : function () {

          var okFields = 0;
          fields.each( function (i, e) {

            if ( e.value ) {
              $(e).removeClass('ui-state-error');
              ++okFields;
            }
            else {
              $(e).addClass('ui-state-error');
            } //if
          
          }); //each

          if ( okFields === fields.length ) {

            if (buildVideo( $('#dialog-add-video-url').val(), 
                            $('#dialog-add-popcorn').val(), 
                            $('#dialog-add-transition-in').val(), 
                            $('#dialog-add-transition-out').val(), 
                            $('#dialog-add-video-name').val()) === false) {
              $('#dialog-add-popcorn').addClass('ui-state-error');
              $('#dialog-add-error').html(error.toString());
              $('#dialog-add-error').addClass('ui-state-highlight');
            }
            else {
              $(this).dialog('close');
            } //if

          } //if

        },

        Cancel : function () {
          $(this).dialog('close');
        },

      },

      close : function () {
        //fields.val('');
        fields.removeClass('ui-state-error');
        $('#dialog-add-error').removeClass('ui-state-highlight');
        $('#dialog-add-error').html('');
      },

    });
  })();

  $('#edit-menu').dialog({
    position: [0, 0],
    width: 200,
    modal: false,
    stack: false,
    autoOpen: false,
    closeOnEscape: false,
    open: function (e, ui) {
      $(".ui-dialog-titlebar-close").hide();
    },
  });

  if (true || edit > -1) {
    $('#edit-menu').dialog('open');
  } //if

  $win.bind("beforeunload", function( event ) {
    return "Are you sure you want to leave?";
  });

  $win.keypress( function( event ) {
    var elem = event.srcElement || event.target;
    if ( (event.which === 46 || event.which === 8) &&
         (elem.nodeName !== "INPUT" && elem.nodeName !== "TEXTAREA") ) {
      event.preventDefault();
    }
  });

  function makeStorage() {
    var store = {
      type: 'Action v0.1 Store',
      sections: [],
    };

    for (var i=0; i<sections.length; ++i) {
      store.sections.push(sections[i].getReplica());
    } //for

    return store;
  }; //makeStorage

  function loadProject(project) {
    $('#videos').empty();
    $('#containers').empty();
    $('#edit-menu-videos').empty();
    sections = [];
    for (var i=0; i<project.sections.length; ++i) {
      var section = project.sections[i];
      buildVideo( section.video,
                  section.popcornSrc,
                  section.transitionIn,
                  section.transitionOut,
                  section.name);
    } //for
  }; //loadProject

  $('#dialog-export').dialog({
    modal: true,
    autoOpen: false,
    width: 550,
    height: 500,
    buttons: {
      'Ok': function() {
        $(this).dialog('close');  
      },
    }
  });

  $('#dialog-import').dialog({
    modal: true,
    autoOpen: false,
    width: 550,
    height: 500,
    buttons: {
      'Ok': function() {
        $(this).dialog('close');  
        toggleEditMode(false);
        loadProject(JSON.parse($('#dialog-import-data').val()));
      },
      'Cancel': function() {
        $(this).dialog('close');  
      },
    }
  });

  $('#dialog-load').dialog({
    modal: true,
    autoOpen: false,
    width: 550,
    height: 500,
    buttons: {
      'Cancel': function() {
        $(this).dialog('close');  
      },
    }
  });

  $('#dialog-save').dialog({
    modal: true,
    autoOpen: false,
    width: 350,
    height: 300,
    buttons: {
      'Ok': function() {
        $(this).dialog('close');  
        var store = makeStorage();
        store.projectName = $('#dialog-save-data').val();
        savedItems.push(store);
        localStorage.setItem('Action', JSON.stringify(savedItems));
      },
      'Cancel': function() {
        $(this).dialog('close');
      },
    }
  });

  $('#save-export').click( function (event) {
    var store = makeStorage();
    $('#dialog-export-data').html(JSON.stringify(store));
    $('#dialog-export').dialog('open');
  });

  $('#save-store').click( function (event) {
    $('#dialog-save').dialog('open');
  });

  $('#load-store').click( function (event) {
    $('#dialog-load').empty();
    $('#dialog-load').append('<h3>Choose a project to load:</h3>');
    for (var i=0; i<savedItems.length; ++i) {
      (function() {
        var savedItem = savedItems[i];
        var $li = $('<li><a>'+savedItem.projectName+'</a></li>');
        $li.click( function (e) {
          $('#dialog-load').dialog('close');
          loadProject(savedItem);
        });
        $('#dialog-load').append($li);
      })();
    } //for
    $('#dialog-load').dialog('open');
  });

  $('#load-import').click( function (event) {
    $('#dialog-import').dialog('open');
  });

  $('#controls-next').hide();
  $('#controls-last').hide();
  $('#controls-next').click( function (e) {
    currentSection.transitionOut(playNextSection);
  });
  $('#controls-last').click( function (e) {
    currentSection.transitionOut(playLastSection);
  });

  $('#plugin-context-menu').hide();

  $('#edit-menu-publish').hide();
  $('#edit-menu-publish').click( function (e) {
  });

  toggleEditMode(true);

  $('#modes-edit').click( function (e) {
    toggleEditMode(true);
  });

  $('#modes-view').click( function (e) {
    toggleEditMode(false);
    if (currentSection) {
      playSection(currentSection);
    } //if
  });

});