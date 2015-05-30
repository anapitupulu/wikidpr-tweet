angular.module('myApp')

.factory('twitterService', function($q) {

    var oauthHandle = null;
    var connected = false; 

    return {
        initialize: function() {
            //initialize OAuth.io with public key of the application
            OAuth.initialize('7fJaEiehtRcguYmajy-uxDekk8U', {cache:true});
            //try to create an authorization result when the page loads, this means a returning user won't have to click the twitter button again
            oauthHandle = OAuth.create('twitter');
            if (oauthHandle !== false) {
                connected = true;
            }
        },
        isReady: function() {
            return (connected);
        },
        connectTwitter: function() {
            var deferred = $q.defer();
            OAuth.popup('twitter', {cache:true}).done(function(twitter) { //cache means to execute the callback if the tokens are already present
                connected = true;
                deferred.resolve();
            }).fail(function (error) {
                console.log(error);
            });
            return deferred.promise;
        },
        clearCache: function() {
            OAuth.clearCache('twitter');
            connected = false;
        },
        getUserLatestTweets: function () {
            //create a deferred object using Angular's $q service
            var deferred = $q.defer();
            var promise = oauthHandle.get('/1.1/statuses/user_timeline.json?count=3').done(function(data) { //https://dev.twitter.com/docs/api/1.1/get/statuses/home_timeline
                //when the data is retrieved resolved the deferred object
                deferred.resolve(data)
            });
            //return the promise of the deferred object
            return deferred.promise;
        },
        getUserInfo: function() {
            var deferred = $q.defer();
            var promise = oauthHandle.get('1.1/account/verify_credentials.json').done(function(data) {
                deferred.resolve(data)
            });

            return deferred.promise;
        },
        postTweet: function(tweetText) {
            var deferred = $q.defer();
            var promise = oauthHandle.post('1.1/statuses/update.json', {
                data: {
                    status: tweetText
                }
            }).done(function(data) {
                deferred.resolve();
            });
            return deferred.promise;
        }
    }
    
});
