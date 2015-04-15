'use strict';

// Declare app level module which depends on views, and components
var app = angular.module('myApp', [
  'ngRoute',
  'myApp.view1',
  'myApp.view2',
  'myApp.version',
  'ui.bootstrap'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.otherwise({redirectTo: '/view1'});
}]);

app.controller('homeController', ['$scope', '$http', function ($scope, $http) {

    $scope.komisi = [ 'Komisi I', 'Komisi II', 'Komisi III', 'Komisi IV' ];
    $scope.selectedKomisi = $scope.komisi[0];

    $scope.anggota = [
        { id: 1, name: 'Alex', party: 'Libertarian', district: 'Malang'},
        { id: 2, name: 'Indah', party: 'Democrat', district: 'Jambi' },
        { id: 3, name: 'Zee', party: 'Green', district: 'Bukit Tinggi'},
        { id: 4, name: 'Greg', party: 'Republican', district: 'Jakarta'}
    ];
    $scope.anggotaSelected = "";
    $scope.tweetText = '';

    $scope.$watch('anggotaSelected', function(newValue, oldValue) {
        if (newValue.name !== undefined && newValue.id != oldValue.id) {
            $scope.tweetText = '#' + newValue.name + ' #' + newValue.party + ' #' + newValue.district + ' ';
        }
    });

}]);
