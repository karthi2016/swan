/*
 * Copyright (C) SWAN (Saar Web-based ANotation system) contributors. All rights reserved.
 * Licensed under the GPLv2 License. See LICENSE in the project root for license information.
 */
'use strict';

angular
    .module('app')
    .controller('schemesController', ['$scope', '$rootScope', '$window', '$http', '$uibModal', '$location', '$q',
    function ($scope, $rootScope, $window, $http, $uibModal, $location, $q) {

    	$rootScope.validateSignedInUser();

        /**
         * Called at the end of Controller construction.
         * Initializes fields with data from Server.
         */
        $scope.init = function () {
            $scope.loaded = false;
			$rootScope.schemesTable = {};	// For scheme view
			$rootScope.tableSchemes = [];
            var httpSchemes = $scope.loadSchemes();
            $q.all([httpSchemes]).then(function () {
                $scope.loaded = true;
                $scope.buildTableSchemes();
            });

            if ($rootScope.tour !== undefined) {
                $rootScope.tour.resume();
            }
        };

        /**
         * Request list of all schemes.
         * @returns http-Object of query
         */
        $scope.loadSchemes = function () {
            var httpSchemes = $http.get("swan/scheme/schemes").success(function (response) {
                $scope.schemes = JSOG.parse(JSON.stringify(response)).schemes;
            }).error(function (response) {
                if (response == "") {
                    $rootScope.redirectToLogin();
                }
            });
            return httpSchemes;
        };

        /**
         * Construct displayed table from Scheme and Project information.
         */
        $scope.buildTableSchemes = function () {
            $scope.schemeCounter = 0;   // TODO does this have any effect?

            for (var i = 0; i < $scope.schemes.length; i++) {
                var scheme = this.schemes[i];
				$rootScope.schemesTable[scheme.name] = scheme;
                var schemePreview = {
                    'id': scheme.id,
                    'name': scheme.name,
                    'creator': scheme.creator,
                    'projects': scheme.projects,
                    'tableIndex': $scope.schemeCounter
                };

				$rootScope.tableSchemes.push(schemePreview);
            }

        };

        $scope.isDeletingPossible = function (scheme) {
            return scheme.projects.length < 1
                && ($window.sessionStorage.role == 'admin'
                    || ($window.sessionStorage.role == 'projectmanager'
                        && scheme.creator != null
                        && scheme.creator.id == $window.sessionStorage.uId));
        };

        /******************
         *******Modals*****
         *******************/

        /**
         * Called upon clicking 'x'-Button of a Scheme.
         * Opens Modal, asking the user to confirm her action.
         * @param {int} id of Scheme that will be deleted.
         */
        $scope.openSchemeDeleteModal = function (id) {
            $rootScope.currentSchemeId = id;
            var modalInstance = $uibModal.open({
                animation: $scope.animationsEnabled,
                templateUrl: 'templates/schemes/schemeDeleteModal.html',
                controller: 'schemeDeleteModalController'
            });

            modalInstance.result.then(function (response) {

            });
            $scope.toggleAnimation = function () {
                $scope.animationsEnabled = !$scope.animationsEnabled;
            };

        };

        /**
         * Called upon clicking '+ Scheme'-Button.
         * Opens the Scheme-Builder Modal.
         */
        $scope.openUploadSchemeModal = function () {
            var modalInstance = $uibModal.open({
                animation: $scope.animationsEnabled,
                templateUrl: 'templates/schemes/schemeUploadModal.html',
                controller: 'schemeUploadModalController',
                size: 'lg',
                backdrop: false
            });

            modalInstance.result.then(function (response) {

            });
            $scope.toggleAnimation = function () {
                $scope.animationsEnabled = !$scope.animationsEnabled;
            };
        };

        /**
         * Called upon clicking the 'Page'-Glyphicon.
         * Opens the Scheme-View Modal.
         * @param {type} name
         */
        $scope.openSchemeViewModal = function (name) {

            const uidObject = {
                animation: $scope.animationsEnabled,
                templateUrl: 'templates/schemes/schemeViewModal.html',
                controller: 'schemeViewModalController'
            };
            var modalInstance = null;

            var scheme = $rootScope.schemesTable[name];
            if (scheme.spanTypes === undefined) {
                $http.get("swan/scheme/byid/" + scheme.id).success(function (response) {
                    scheme = response.scheme;
                    $rootScope.currentScheme = scheme;
                    modalInstance = $uibModal.open(uidObject);
                    modalInstance.result.then(function (response) {

                    });
                }).error(function (response) {
                    $rootScope.checkResponseStatusCode(response.status);
                });
            } else {
                $rootScope.currentScheme = scheme;
                modalInstance = $uibModal.open(uidObject);
                modalInstance.result.then(function (response) {

                });
            }

            $scope.toggleAnimation = function () {
                $scope.animationsEnabled = !$scope.animationsEnabled;
            };
        };

        $scope.init();
    }
]);



