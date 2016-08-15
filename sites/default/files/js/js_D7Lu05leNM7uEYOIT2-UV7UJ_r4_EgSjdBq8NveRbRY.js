/**
 * @file
 * JavaScript API for the History module, with client-side caching.
 *
 * May only be loaded for authenticated users, with the History module enabled.
 */

(function ($, Drupal, drupalSettings, storage) {

  'use strict';

  var currentUserID = parseInt(drupalSettings.user.uid, 10);

  // Any comment that is older than 30 days is automatically considered read,
  // so for these we don't need to perform a request at all!
  var thirtyDaysAgo = Math.round(new Date().getTime() / 1000) - 30 * 24 * 60 * 60;

  // Use the data embedded in the page, if available.
  var embeddedLastReadTimestamps = false;
  if (drupalSettings.history && drupalSettings.history.lastReadTimestamps) {
    embeddedLastReadTimestamps = drupalSettings.history.lastReadTimestamps;
  }

  /**
   * @namespace
   */
  Drupal.history = {

    /**
     * Fetch "last read" timestamps for the given nodes.
     *
     * @param {Array} nodeIDs
     *   An array of node IDs.
     * @param {function} callback
     *   A callback that is called after the requested timestamps were fetched.
     */
    fetchTimestamps: function (nodeIDs, callback) {
      // Use the data embedded in the page, if available.
      if (embeddedLastReadTimestamps) {
        callback();
        return;
      }

      $.ajax({
        url: Drupal.url('history/get_node_read_timestamps'),
        type: 'POST',
        data: {'node_ids[]': nodeIDs},
        dataType: 'json',
        success: function (results) {
          for (var nodeID in results) {
            if (results.hasOwnProperty(nodeID)) {
              storage.setItem('Drupal.history.' + currentUserID + '.' + nodeID, results[nodeID]);
            }
          }
          callback();
        }
      });
    },

    /**
     * Get the last read timestamp for the given node.
     *
     * @param {number|string} nodeID
     *   A node ID.
     *
     * @return {number}
     *   A UNIX timestamp.
     */
    getLastRead: function (nodeID) {
      // Use the data embedded in the page, if available.
      if (embeddedLastReadTimestamps && embeddedLastReadTimestamps[nodeID]) {
        return parseInt(embeddedLastReadTimestamps[nodeID], 10);
      }
      return parseInt(storage.getItem('Drupal.history.' + currentUserID + '.' + nodeID) || 0, 10);
    },

    /**
     * Marks a node as read, store the last read timestamp client-side.
     *
     * @param {number|string} nodeID
     *   A node ID.
     */
    markAsRead: function (nodeID) {
      $.ajax({
        url: Drupal.url('history/' + nodeID + '/read'),
        type: 'POST',
        dataType: 'json',
        success: function (timestamp) {
          // If the data is embedded in the page, don't store on the client
          // side.
          if (embeddedLastReadTimestamps && embeddedLastReadTimestamps[nodeID]) {
            return;
          }

          storage.setItem('Drupal.history.' + currentUserID + '.' + nodeID, timestamp);
        }
      });
    },

    /**
     * Determines whether a server check is necessary.
     *
     * Any content that is >30 days old never gets a "new" or "updated"
     * indicator. Any content that was published before the oldest known reading
     * also never gets a "new" or "updated" indicator, because it must've been
     * read already.
     *
     * @param {number|string} nodeID
     *   A node ID.
     * @param {number} contentTimestamp
     *   The time at which some content (e.g. a comment) was published.
     *
     * @return {bool}
     *   Whether a server check is necessary for the given node and its
     *   timestamp.
     */
    needsServerCheck: function (nodeID, contentTimestamp) {
      // First check if the content is older than 30 days, then we can bail
      // early.
      if (contentTimestamp < thirtyDaysAgo) {
        return false;
      }

      // Use the data embedded in the page, if available.
      if (embeddedLastReadTimestamps && embeddedLastReadTimestamps[nodeID]) {
        return contentTimestamp > parseInt(embeddedLastReadTimestamps[nodeID], 10);
      }

      var minLastReadTimestamp = parseInt(storage.getItem('Drupal.history.' + currentUserID + '.' + nodeID) || 0, 10);
      return contentTimestamp > minLastReadTimestamp;
    }
  };

})(jQuery, Drupal, drupalSettings, window.localStorage);
;
/**
 * @file
 * Marks the nodes listed in drupalSettings.history.nodesToMarkAsRead as read.
 *
 * Uses the History module JavaScript API.
 *
 * @see Drupal.history
 */

(function (window, Drupal, drupalSettings) {

  'use strict';

  // When the window's "load" event is triggered, mark all enumerated nodes as
  // read. This still allows for Drupal behaviors (which are triggered on the
  // "DOMContentReady" event) to add "new" and "updated" indicators.
  window.addEventListener('load', function () {
    if (drupalSettings.history && drupalSettings.history.nodesToMarkAsRead) {
      Object.keys(drupalSettings.history.nodesToMarkAsRead).forEach(Drupal.history.markAsRead);
    }
  });

})(window, Drupal, drupalSettings);
;
/**
 * @file
 * JavaScript for the Disqus Drupal module.
 */

// The Disqus global variables.
var disqus_shortname = '';
var disqus_url = '';
var disqus_title = '';
var disqus_identifier = '';
var disqus_disable_mobile = 0;
var disqus_def_name = '';
var disqus_def_email = '';
var disqus_config;

(function ($) {

"use strict";

Drupal.disqus = {};

/**
 * Drupal Disqus behavior.
 */
Drupal.behaviors.disqus = {
  attach: function (context, settings) {
    // Load the Disqus comments.
    if (settings.disqus || false) {

      // Ensure that the Disqus comments are only loaded once
      $('body').once('disqus').each(function() {

        // Setup the global JavaScript variables for Disqus.
        disqus_shortname = settings.disqus.domain;
        disqus_url = settings.disqus.url;
        disqus_title = settings.disqus.title;
        disqus_identifier = settings.disqus.identifier;
        disqus_disable_mobile = settings.disqus.disable_mobile || 0;
        disqus_def_name = settings.disqus.name || '';
        disqus_def_email = settings.disqus.email || '';

        // Language and SSO settings are passed in through disqus_config().
        disqus_config = function() {
          if (settings.disqus.language || false) {
            this.language = settings.disqus.language;
          }
          if (settings.disqus.remote_auth_s3 || false) {
            this.page.remote_auth_s3 = settings.disqus.remote_auth_s3;
          }
          if (settings.disqus.api_key || false) {
            this.page.api_key = settings.disqus.api_key;
          }
          if (settings.disqus.sso || false) {
            this.sso = settings.disqus.sso;
          }
          if (settings.disqus.callbacks || false) {
            for (var key in settings.disqus.callbacks) {
              for (var i = 0; i < settings.disqus.callbacks[key].length; i++) {
                var callback = settings.disqus.callbacks[key][i].split('.');
                var fn = window;
                for (var j = 0; j < callback.length; j++) {
                  fn = fn[callback[j]];
                }
                if(typeof fn === 'function') {
                  this.callbacks[key].push(fn);
                }
              }
            }
          }
        };

        // Make the AJAX call to get the Disqus comments.
        jQuery.ajax({
          type: 'GET',
          url: '//' + disqus_shortname + '.disqus.com/embed.js',
          dataType: 'script',
          cache: false
        });
      });
    }


    // Load the comment numbers JavaScript.
    if (settings.disqusComments || false) {
      // Ensure that comment numbers JavaScript is only loaded once.
      $('body').once('disqusComments').each(function() {
        disqus_shortname = settings.disqusComments;
        // Make the AJAX call to get the number of comments.
        jQuery.ajax({
          type: 'GET',
          url: '//' + disqus_shortname + '.disqus.com/count.js',
          dataType: 'script',
          cache: false
        });
      });
    }
  }
};

})(jQuery);
;
/**
 * @file
 * Javascript for disqus configuration form.
 */

(function ($) {

"use strict";

Drupal.behaviors.disqusSettingsForm = {
  attach: function (context) {
    var $context = $(context);

    $context.find('#edit-visibility').drupalSetSummary(function(context) {
      var vals = [];

      $('#edit-disqus-nodetypes div.form-type-checkbox').each(function(){
        var vals_node_types = [];
        if ($(this).find('input').is(':checked')) {
          vals_node_types.push(Drupal.checkPlain($(this).find('label').text()));
        }

        if (vals_node_types.length) {
          vals.push($('label[for="edit-disqus-nodetypes"]').text() + ': ' + vals_node_types.join(', '));
        }
      });

      vals.push(Drupal.t('Location: ') + Drupal.checkPlain($('#edit-disqus-location').val()));
      vals.push(Drupal.t('Weight: ') + Drupal.checkPlain($('#edit-disqus-weight').val()));

      return vals.join('<br />');
    });

    $context.find('#edit-behavior').drupalSetSummary(function(context) {
      var vals = [];

      if ($('#edit-disqus-userapikey').val()) {
        vals.push($('#edit-disqus-userapikey').parent().find('label').text());
      }

      var checkboxes = ['#edit-disqus-localization', '#edit-disqus-inherit-login', '#edit-disqus-disable-mobile'];
      for (var i in checkboxes) {
        if ($(checkboxes[i]).is(':checked')) {
          vals.push($(checkboxes[i]).parent().find('label').text());
        }
      }

      return vals.join(', ');
    });

    $context.find('#edit-advanced').drupalSetSummary(function(context) {
      var vals = [];

      if ($('#edit-disqus-publickey').val()) {
        vals.push($('#edit-disqus-publickey').parent().find('label').text());
      }

      if ($('#edit-disqus-secretkey').val()) {
        vals.push($('#edit-disqus-secretkey').parent().find('label').text());
      }

      return vals.join(', ');
    });
  }
};

})(jQuery);
;
/**
 * @file
 * JavaScript for the Disqus Google Analytics module.
 */

(function($) {

"use strict";

/**
 * Track new comments in Google analytics.
 */
Drupal.disqus.disqusTrackNewComment = function() {

  // Make sure that the google analytics event tracking object or
  // the universal analytics tracking function exists.
  // If not, then exit and don't track.
  if (typeof _gaq == "undefined" && typeof ga == "undefined") {
    return;
  }

  // Construct current page relative URL to be used as event Label.
  var label = document.location.href.toLowerCase().substring((document.location.href.toLowerCase().indexOf(document.domain.toLowerCase())) + (document.domain.toLowerCase().length));

  if (typeof _gaq != 'undefined') {
    _gaq.push(['_trackEvent', 'Disqus', 'Comment', label]);
  }
  else {
    ga('send', {
      'hitType': 'event',
      'eventCategory': 'Disqus',
      'eventAction': 'Comment',
      'eventLabel': label
    });
  }
};

})(jQuery);
;
