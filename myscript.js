var annotation = [{
    pos:{page:1,x:77.69607843137256,y:10.732323232323232},
    text:"page 1 annotaiton",
    id:1
  },{
    pos:{page:2,x:77.69607843137256,y:20.732323232323232},
    text:"page 2 annotation",
    id:2
  },{
    pos:{page:3,x:47.69607843137256,y:57.732323232323232},
    text:"page 3",
    id:3
  },{
    pos:{page:4,x:45.69607843137256,y:50.732323232323232},
    text:"page 4 top right",
    id:4,
  },{
    pos:{page:5,x:80.69607843137256,y:80.732323232323232},
    text:"remove page 5 top right",
    id:5
  }]
  var attempt = 1 ;
var __PDF_DOC,
    __CURRENT_PAGE,
    __TOTAL_PAGES,
    __PAGE_RENDERING_IN_PROGRESS,
    __CANVAS,
    __SIZE = 1,
    __CANVAS_CTX;

// Initialize and load the PDF
function showPDF(pdf_url,password) {
    // Show the pdf loader
    $("#pdf-loader").show();
    $('#pdf-main-container').show();

    PDFJS.getDocument({ url: pdf_url, password: password ? password : null }).then(function(pdf_doc) {
        __PDF_DOC = pdf_doc;
        __TOTAL_PAGES = __PDF_DOC.numPages;
        
        // Hide the pdf loader and show pdf container in HTML
        $("#pdf-loader").hide();
        $("#pdf-contents").show();
        $("#pdf-total-pages").text(__TOTAL_PAGES);
        //LIST ANNOTATION
        listAnnotation()
        // Show the first page
        showPage(1);
    }).catch(function(error) {
        $("#pdf-loader").hide();
        $('#pdf-main-container').hide();
        // If error re-show the upload button
        console.log(error);
        if(error.name == 'PasswordException') {
          let str = 'Enter Password'
          if(error.code == 2){
            str = 'Incorrect password try again';
          }
          pass = prompt(str)
          if(attempt == 4){
            return alert('to many wrong attempt..')
          }
          attempt++;
          return showPDF(URL.createObjectURL($('input').get(0).files[0]),pass);
        }
        alert(error.message)
    });;
}

// Load and render a specific page of the PDF
function showPage(page_no,highlight) {
  __PAGE_RENDERING_IN_PROGRESS = 1;
  __CURRENT_PAGE = page_no;

  // Disable Prev & Next buttons while page is being loaded
  $("#pdf-next, #pdf-prev").attr('disabled', 'disabled');

  // While page is being rendered hide the canvas and show a loading message
  $("#pdf-canvas").hide();
  $('#pdf-meta').hide()
  $("#page-loader").show();

  // Update current page in HTML
  $("#pdf-current-page").text(page_no);
  
  // Fetch the page
  __PDF_DOC.getPage(page_no).then(function(page) {
    // As the canvas is of a fixed width we need to set the scale of the viewport accordingly
    var scale_required = __CANVAS.width / page.getViewport(__SIZE).width;
    // Get viewport of the page at required scale
    var viewport = page.getViewport(__SIZE);

    // Set canvas height &  width
    __CANVAS.height = page.getViewport(__SIZE).height;
    __CANVAS.width = page.getViewport(__SIZE).width;

    var renderContext = {
      canvasContext: __CANVAS_CTX,
      viewport: viewport
    };
      
    // Render the page contents in the canvas
    page.render(renderContext).then(function() {
      __PAGE_RENDERING_IN_PROGRESS = 0;
      renderAnnotation();
      // Re-enable Prev & Next buttons
      $("#pdf-next, #pdf-prev").removeAttr('disabled');
      if(highlight!=undefined){
        setTimeout(()=>{showHighlight(highlight)},500)
      }
      // Show the canvas and hide the page loader
      $("#pdf-canvas").show();
      $('#pdf-meta').show();
      $("#page-loader").hide();
    });
  });
}

function renderAnnotation(){
  $('.pdf-annotation').remove()
  pageAnnotation = annotation.filter(item=>{return item.pos.page==__CURRENT_PAGE})
  pageAnnotation.forEach(item=>{
    let append = ann.replace('__TITLE__',item.text)
      .replace('__X__',item.pos.x)
      .replace('__Y__',item.pos.y)
      .replace('__ID__',item.id)
    $('.pdf-container').append(append)
  })
}

function listAnnotation(){
  $('ul.list').empty();
  annotation.forEach(item=>{
    let append = li.replace('__TITLE__',item.text)
      .replace('__PAGE__',item.pos.page)
      .replace('__ID__',item.id)
    $('ul.list').append(append)
  })
}

function showHighlight(elId){
  let el = $('.pdf-annotation[data-id='+elId+']')
  el.addClass('highlight');
  let wrapper = $('.pdf-wrapper');
  let pos = (wrapper.scrollTop() + el.offset().top) - (wrapper.height()/2);
  wrapper.animate({
    scrollTop: pos
  }, 500);
  setTimeout(()=>{el.removeClass('highlight')},1500);
}

function randomString() {
  var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
  var string_length = 8;
  var result = '';
  for (var i=0; i<string_length; i++) {
    var rnum = Math.floor(Math.random() * chars.length);
    result += chars.substring(rnum,rnum+1);
  }
  return result;
}


let li = '<li data-goto="__PAGE__" data-id="__ID__">__TITLE__</li>'
let ann = '<div class="pdf-annotation" data-id="__ID__" title="__TITLE__" style="left:__X__%;top:__Y__%;"></div>';

$('document').ready(()=>{
  __PAGE_RENDERING_IN_PROGRESS = 0;
  __CANVAS = $('#pdf-canvas').get(0);
  __CANVAS_CTX = __CANVAS.getContext('2d');

  $ ("input[type='file']").on('change', function() {
    console.log('loading file...');
    showPDF(URL.createObjectURL($(this).get(0).files[0]));
  });

  // Previous page of the PDF
  $("#pdf-prev").on('click', function() {
    if(__CURRENT_PAGE != 1)
      showPage(--__CURRENT_PAGE);
  });

  // Next page of the PDF
  $("#pdf-next").on('click', function() {
    if(__CURRENT_PAGE != __TOTAL_PAGES)
      showPage(++__CURRENT_PAGE);
  });

  $('#pdf-canvas').on('click',function(e){
    var text = prompt('Enter text....')
    if(text==null)
      return ;
    else if(text.length==0)
      return ;
    let originalEvent = event;
    let target = event.target;
    let rect = target.getBoundingClientRect();
    let x = originalEvent.clientX - rect.left-5;
    let y = originalEvent.clientY - rect.top-5;
    annotation.push({
      text:text,
      id:randomString(),
      pos:{
        // u : Meteor.userId(),
        x : ( x/rect.width * 100),
        y : ( y/rect.height * 100),
        page:__CURRENT_PAGE
      }
    })
    renderAnnotation()
    listAnnotation()
  })


  $('body').on('click','ul.list > li',function(){
    if(__CURRENT_PAGE == $(this).data('goto')){
      showHighlight($(this).data('id'))
    }
    else{
      showPage($(this).data('goto'),$(this).data('id'));
    }
  })

  $('body').on('click','.pdf-annotation',function(){
    let el = $('ul.list > li[data-id='+$(this).data('id')+']');
    el.addClass('highlight');
    let wrapper = $('ul.list');
    let pos = (wrapper.scrollTop() + el.offset().top) - (wrapper.height()/2);
    wrapper.animate({
      scrollTop: pos
    }, 500);
    setTimeout(()=>{el.removeClass('highlight')},1500);
  })

});