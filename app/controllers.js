//inject the twitterService into the controller
angular.module('myApp')

.controller('WikiDprTweetController', ['$scope', '$q', 'twitterService', '$http', function($scope, $q, twitterService, $http) {

    twitterService.initialize();

    $scope.userInfo =  {
        loggedIn: false,
        username: "",
        latestTweets: []
    }

    $scope.tweetInfo = {
        anggota: "",
        text: "",
        textLimitStyle: ""
    }

    var refreshUserInfo = function() {

        if (twitterService.isReady()) {
            $scope.userInfo.loggedIn = true;
            twitterService.getUserInfo().then(function (userInfo) {
                $scope.userInfo.username = userInfo.screen_name;
            });

            twitterService.getUserLatestTweets().then(function (latestTweets) {
                $scope.userInfo.latestTweets = latestTweets;
            });
        } else {
            $scope.userInfo.loggedIn = false;
            $scope.userInfo.username = "";
            $scope.userInfo.latestTweets = [];
        }
    }

    var resetTweetInfo = function() {
        $scope.tweetInfo.anggota = "";
        $scope.tweetInfo.text = "";
        $scope.tweetInfo.textLimitStyle = "";
    };

    refreshUserInfo();
    resetTweetInfo();

    //when the user clicks the connect twitter button, the popup authorization window opens
    $scope.connectButton = function() {
        twitterService.connectTwitter().then(function() {
            if (twitterService.isReady()) {
                refreshUserInfo();
                resetTweetInfo();
            }
        });
    };

    $scope.signOut = function() {
        twitterService.clearCache();
        refreshUserInfo();
        resetTweetInfo();
    };

    $scope.findAnggota = function(anggota) {
        var searchUrl = 'http://wikidpr.org/api/v2/anggota';
        return $http.get(searchUrl, {
            params: { s: anggota }
        }).then(function (response) {
            return response.data.data;
        });
    };

    $scope.onAnggotaSelected = function($item, $model, $label) {
       var tokenizedTwitterUrl = $item.twitter.split("/");
       var twitterId = tokenizedTwitterUrl[tokenizedTwitterUrl.length-1];
       if (twitterId.length === 0) {
         twitterId = $item.nama;
       } else {
         twitterId = "@" + twitterId;
       }
       var komisi = $item.komisi;
       var partai = $item.partai

       $scope.tweetInfo.text = twitterId + " " + "#" + partai + " #Komisi" + komisi + " ";
    };

    $scope.submitTweet = function(tweetText) {
        twitterService.postTweet(tweetText).then(function() {
            twitterService.getUserLatestTweets().then(function (latestTweets) {
                refreshUserInfo();
                resetTweetInfo();
            });
        });
    }

    $scope.isTextLimitHit = function() {
        if ($scope.tweetInfo.text.length > 180) {
            $scope.tweetInfo.tweetTextLimitStyle = { "color": "red" };
            return true;
        } else {
            $scope.tweetInfo.tweetTextLimitStyle = "";
            return false;
        }
    }
}]);
