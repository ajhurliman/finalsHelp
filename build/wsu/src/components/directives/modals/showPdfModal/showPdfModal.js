angular.module('fh.directives.modals.showPdfModal', [
  'ui.bootstrap',
  'fh.services.ModalService'
])

.directive('showPdfModal', function( ModalService, $http ) {
  return {
    restrict: 'AE',
    link: function(scope, element, attrs) {
      element.on('click', function() {
        ModalService.openModal({
          templateUrl: 'directives/modals/showPdfModal/showPdfModal.tpl.html',
          controller: 'ShowPdfModalController',
          windowClass: 'show-pdf-modal',
          backdrop: 'static',
          keyboard: false,
          resolve: {
            paperToRenderId: function() {
              return scope.paper._id
            }
          }
        });
      });
    }
  };
})

.controller('ShowPdfModalController', function($scope, $timeout, ModalService, paperToRenderId) {
  $scope.close = function() {
    ModalService.closeModal();
  };
  var page;
  $scope.paperToRender = paperToRenderId;

  $timeout(function() {
    var canvas = document.getElementById('rendered-pdf-modal');
    var context = canvas.getContext('2d');
    if ( paperToRenderId ) {
      PDFJS.getDocument( '/api/papers/single/image/' + paperToRenderId ).then(function( pdf ) {
        pdf.getPage(1).then(function( page ) {

          var scale = 1;
          var viewport = page.getViewport(scale);

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          var renderContext = {
            canvasContext: context,
            viewport: viewport
          };
          page.render(renderContext);
        });

        $scope.pdf = pdf;
        $scope.page = 1

        // event listeners for PDF page navigation
        document.getElementById('previous-page-modal').addEventListener('click',
          function() {
            if ( $scope.page > 1 ) {
              $scope.page--;
              renderPdf( $scope.page );
            }
        });
        document.getElementById('next-page-modal').addEventListener('click',
          function() {
            if ( $scope.pdf.numPages > $scope.page ) {
              $scope.page++;
              renderPdf( $scope.page );
            }
        });
      });
    } else {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, 50);

  // $scope.nextPage = function() {
  //   if ( $scope.pdf.numPages > $scope.page ) {
  //     $scope.page++;
  //     renderPdf( $scope.page );
  //   }
  // };

  function renderPdf( page ) {
    var canvas = document.getElementById('rendered-pdf-modal');
    var context = canvas.getContext('2d');

    $scope.pdf.getPage( page ).then(function( renderPage ) {
      var scale = 1;
      var viewport = renderPage.getViewport(scale);

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      var renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      renderPage.render(renderContext);
    })
  }
    
});
