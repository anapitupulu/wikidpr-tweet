// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'satellizer', 'starter.services', 'starter.controllers'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

  // setup an abstract state for the tabs directive
    .state('tab', {
    url: "/tab",
    abstract: true,
    templateUrl: "templates/tabs.html"
  })

  // Each tab has its own nav history stack:
  .state('tab.tweet', {
    url: '/tweet',
    views: {
        'tab-tweet': {
            templateUrl: 'templates/tab-tweet.html',
            controller: 'TweetCtrl',
            controllerAs: 'Tweet'
        }
    }
  })

  .state('tab.posttweet', {
    url: '/posttweet',
    views: {
        'tab-tweet': {
            templateUrl: 'templates/tab-posttweet.html',
            controller: 'PostTweetCtrl',
            controllerAs: 'PostTweet'
        }
    }
  })
  ;
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/tweet');
})

// Configure Satellizer.
.config(function($authProvider) {

  // Configuration common for all providers.
  var commonConfig = {
    // Popup should expand to full screen with no location bar/toolbar.
    popupOptions: {
      location: 'no',
      toolbar: 'no',
      width: window.screen.width,
      height: window.screen.height,
      withCredentials: false
    },
  };

  // Change the platform and redirectUri only if we're on mobile
  // so that development on browser can still work. 
  if (ionic.Platform.isIOS() || ionic.Platform.isAndroid()) {
    $authProvider.platform   = 'mobile';
    commonConfig.redirectUri = 'http://localhost/';
  }

  $authProvider.twitter(angular.extend({}, commonConfig, {
    url: 'http://milton.sleigner.com:3000/auth/twitter'
  }));
})
.constant('maxTweetChars', 140)
.constant('WikiDprServiceUrl', 'http://milton.sleigner.com:3000')
;
