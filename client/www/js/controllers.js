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

.controller('TweetCtrl', ['$scope', '$q', '$ionicPopup', 'twitterService', 'wikiDprService', '$http', '$auth', 'maxTweetChars', function($scope, $q, $ionicPopup, twitterService, wikiDprService, $http, $auth, maxTweetChars) {

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
    }

    $scope.anggotaList = [];
    $scope.input = {
        anggotaName: "",
        anggotaKomisi: ""
    };

    var refreshUserInfo = function() {

        if (twitterService.isReady()) {
            $scope.userInfo.loggedIn = true;
        } else {
            $scope.userInfo.loggedIn = false;
            $scope.userInfo.username = "";
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

    $scope.$watchGroup(['input.anggotaName', 'input.anggotaKomisi'], function(newVals, oldVals) {
        var anggotaName = newVals[0];
        var anggotaKomisi = newVals[1];

        if (newVals[0] !== oldVals[0] || newVals[1] !== oldVals[1]) {
            wikiDprService.searchAnggota(anggotaName, anggotaKomisi).then(
                function(result) {
                    $scope.anggotaList = result;
                },
                function(reason) {
                    $ionicPopup.alert({
                        title: 'Internal application error'
                    })
                }
            );
        };
    });

}])
.controller('PostTweetCtrl', ['$scope', '$ionicPopup', 'twitterService', 'wikiDprService', 'maxTweetChars', function($scope, $ionicPopup, twitterService, wikiDprService, maxTweetChars) {

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
            $ionicPopup.alert({
                title: 'Tweet successfully submitted',
                template: tweetText
            });

            // twitterService.getUserLatestTweets().then(function (latestTweets) {
            //     refreshUserInfo();
            //     resetTweetInfo();
            //
            // });
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
;
