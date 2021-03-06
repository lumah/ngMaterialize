"use strict";
var ngMaterialize = angular.module('ngMaterialize', ['ng']);
ModalService.$inject = ['$q', '$http', '$controller', '$timeout', '$rootScope', '$compile'];
function ModalService(q, http, controller, timeout, rootScope, compile) {
    var service = {
        open: open
    };
    function open(options) {
        var resultDeferred = q.defer();
        var openedDeferred = q.defer();
        getTemplate(options).then(function (modalBaseHtml) {
            var modalBase = angular.element(modalBaseHtml);
            var scope = (options.scope || rootScope).$new(false), modalInstance = getModalInstance(options, resultDeferred, modalBase, scope);
            scope.$close = modalInstance.close;
            scope.$dismiss = modalInstance.dismiss;
            compile(modalBase)(scope);
            var openModalOptions = {
                //ready: function() { openedDeferred.resolve(); }, // Callback for Modal open
                complete: function () {
                    modalInstance.dismiss();
                } // Callback for Modal close
            };
            executeController(options, modalInstance, scope);
            modalBase.appendTo('body').openModal(openModalOptions);
        }, function (error) {
            resultDeferred.reject({ templateError: error });
        });
        return resultDeferred.promise;
    }
    function getModalInstance(options, resultDeferred, modalBase, scope) {
        return {
            params: options.params || {},
            close: function (result) {
                resultDeferred.resolve(result);
                closeModal(modalBase, scope);
            },
            dismiss: function (reason) {
                resultDeferred.reject(reason);
                closeModal(modalBase, scope);
            }
        };
    }
    function executeController(options, modalInstance, scope) {
        if (!options.controller)
            return;
        var controllerDefinitionOrName = options.controller;
        var ctrl = controller(controllerDefinitionOrName, {
            $scope: scope,
            $modalInstance: modalInstance
        });
        if (angular.isString(options.controllerAs)) {
            scope[options.controllerAs] = ctrl;
        }
    }
    function getTemplate(options) {
        return new q(function (resolve, reject) {
            if (options.templateUrl) {
                var url = resolveFunction(options.templateUrl);
                http.get(url).success(function (data) {
                    resolve(data);
                }).catch(function (error) {
                    reject(error);
                });
            }
            else {
                resolve(resolveFunction(options.template) || '');
            }
        }).then(function (template) {
            var cssClass = options.fixedFooter ? 'modal modal-fixed-footer' : 'modal';
            var html = [];
            html.push('<div class="' + cssClass + '">');
            if (options.title) {
                html.push('<div class="modal-header">');
                html.push(options.title);
                html.push('<a class="grey-text text-darken-2 right" data-ng-click="$dismiss()">');
                html.push('<i class="mdi-navigation-close" />');
                html.push('</a>');
                html.push('</div>');
            }
            html.push(template);
            html.push('</div>');
            return html.join('');
        });
    }
    function closeModal(modalBase, scope) {
        modalBase.closeModal();
        timeout(function () {
            scope.$destroy();
            modalBase.remove();
        }, 5000, true);
    }
    function resolveFunction(fn) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (angular.isFunction(fn)) {
            return fn(args);
        }
        return fn;
    }
    return service;
}
ngMaterialize.factory('$modal', ModalService);
