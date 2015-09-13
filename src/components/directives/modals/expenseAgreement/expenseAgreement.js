angular.module('olci.directives.modals.expenseAgreement', [
    'ui.bootstrap',
    'olci.services.ModalService'
])

.directive('expenseAgreement', function(ModalService) {
    return {
        restrict: 'AE',
        link: function(scope, element, attrs) {
            element.on('click', function() {
                ModalService.openModal({
                    templateUrl: 'directives/modals/expenseAgreement/expenseAgreement.tpl.html',
                    controller: 'expenseAgreementController',
                    windowClass: 'expense-agreement-modal',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        data: function() {
                            return scope.perDiemCost;
                        }
                    }
                });
            });
        },
    };
})

.controller('expenseAgreementController', function($scope, ModalService, data) {
    $scope.close = function() {
        ModalService.closeModal();
    };
    $scope.perDiemCost = data;
});