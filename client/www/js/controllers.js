angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $timeout) {
  // Form data for the login modal
  $scope.loginData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    console.log('Doing login', $scope.loginData);

    // Simulate a login delay. Remove this and replace with your login
    // code if using a login system
    $timeout(function() {
      $scope.closeLogin();
    }, 1000);
  };
})

.controller('TweetCtrl', ['$scope', '$q', 'twitterService', 'wikiDprService', '$http', '$auth', 'maxTweetChars', function($scope, $q, twitterService, wikiDprService, $http, $auth, maxTweetChars) {

    twitterService.initialize();

    $scope.availableKomisi = 
        ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];

    $scope.maxTweetChars = maxTweetChars;

    $scope.config = {
        enablePicture: true
    }

    $scope.userInfo =  {
        loggedIn: false,
        username: "",
        latestTweets: []
    }

    $scope.anggotaList = [];
    $scope.input = {
        anggotaName: "",
        anggotaKomisi: ""
    };

    var refreshUserInfo = function() {

        if (twitterService.isReady()) {
            $scope.userInfo.loggedIn = true;
            // twitterService.getUserInfo().then(function (userInfo) {
            //     $scope.userInfo.username = userInfo.screen_name;
            // });
            //
            // twitterService.getUserLatestTweets().then(function (latestTweets) {
            //     $scope.userInfo.latestTweets = latestTweets;
            // });
        } else {
            $scope.userInfo.loggedIn = false;
            $scope.userInfo.username = "";
            $scope.userInfo.latestTweets = [];
        }
    }

    refreshUserInfo();

    //when the user clicks the connect twitter button, the popup authorization window opens
    $scope.connectButton = function() {
        twitterService.connectTwitter().then(function() {
            if (twitterService.isReady()) {
                refreshUserInfo();
            }
        });
    };

    $scope.signOut = function() {
        twitterService.clearCache();
        refreshUserInfo();
    };

    $scope.selectAnggota = function(anggota) {
        wikiDprService.setAnggotaSelected(anggota);
    };

    // $scope.$watch('input.anggotaName', function(newValue, oldValue) {
    //     if (newValue.length > 3) {
    //         wikiDprService.searchAnggota(newValue, $scope.input.anggotaKomisi).then(function(result) {
    //             $scope.anggotaList = result;
    //         });
    //     }
    // }, true);

    $scope.$watchGroup(['input.anggotaName', 'input.anggotaKomisi'], function(newVals, oldVals) {
        var anggotaName = newVals[0];
        var anggotaKomisi = newVals[1];

        wikiDprService.searchAnggota(anggotaName, anggotaKomisi).then(function(result) {
            $scope.anggotaList = result;
        });
    
    });

    // $scope.$watch('input.anggotaKomisi', function(newValue, oldValue) {
    //     wikiDprService.searchAnggota(newValue, $scope.input.anggotaName).then(function(result) {
    //         $scope.anggotaList = result;
    //     });
    // }, true);

}])
.controller('PostTweetCtrl', ['$scope', 'twitterService', 'wikiDprService', 'maxTweetChars', function($scope, twitterService, wikiDprService, maxTweetChars) {

    $scope.maxTweetChars = maxTweetChars;

    $scope.tweetInfo = {
        anggota: "",
        text: "",
        textLimitStyle: ""
    };

    var resetTweetInfo = function() {

        $scope.anggota = wikiDprService.getAnggotaSelected();
        var twitterId = $scope.anggota.twitter.length > 0 ? "@" + $scope.anggota.twitter : $scope.anggota.nama;
        $scope.tweetInfo.text = "@wikidpr " + $scope.anggota.komisi + " " + twitterId + " @" + $scope.anggota.twitterPartai + " " + $scope.anggota.dapil + " ";
    };

    resetTweetInfo();

    $scope.submitTweet = function(tweetText) {
        twitterService.postTweet(tweetText).then(function() {
            twitterService.getUserLatestTweets().then(function (latestTweets) {
                refreshUserInfo();
                resetTweetInfo();
            });
        });
    };

    $scope.isTextLimitHit = function() {
        if ($scope.tweetInfo.text.length > maxTweetChars) {
            $scope.tweetInfo.textLimitStyle = { "color": "red" };
            return true;
        } else {
            $scope.tweetInfo.textLimitStyle = "";
            return false;
        }
    };

}])
.controller('PlaylistsCtrl', function($scope, $auth) {
  $scope.authenticated = false;

  // Function to be called on ng-click in the template login buttons.
  $scope.authenticate = function(provider) {
    // Perform the actual login.
    // Handles getting the code from provider and making a call to
    // the servers to get the user token and data.
    $auth
      .authenticate(provider)
      .then(function(data) {
        $scope.authenticated = true;
        console.log(data);
      }, function(error) {
        console.log(error);
      })
    ;
  };

  $scope.logout = function() {
    $auth.logout();
    $scope.authenticated = false;
  }

  $scope.playlists = [
    { title: 'Reggae', id: 1 },
    { title: 'Chill', id: 2 },
    { title: 'Dubstep', id: 3 },
    { title: 'Indie', id: 4 },
    { title: 'Rap', id: 5 },
    { title: 'Cowbell', id: 6 }
  ];
})

.controller('PlaylistCtrl', function($scope, $stateParams) {
});
