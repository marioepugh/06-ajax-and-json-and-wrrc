'use strict';

function Article (rawDataObj) {
  this.author = rawDataObj.author;
  this.authorUrl = rawDataObj.authorUrl;
  this.title = rawDataObj.title;
  this.category = rawDataObj.category;
  this.body = rawDataObj.body;
  this.publishedOn = rawDataObj.publishedOn;
}

// REVIEW: Instead of a global `articles = []` array, let's track this list of all articles directly on the
// constructor function. Note: it is NOT on the prototype. In JavaScript, functions are themselves
// objects, which means we can add properties/values to them at any time. In this case, we have
// a key/value pair to track, that relates to ALL of the Article objects, so it does not belong on
// the prototype, as that would only be relevant to a single instantiated Article.
Article.all = [];

Article.prototype.toHtml = function() {
  let template = Handlebars.compile($('#article-template').text());

  this.daysAgo = parseInt((new Date() - new Date(this.publishedOn))/60/60/24/1000);
  this.publishStatus = this.publishedOn ? `published ${this.daysAgo} days ago` : '(draft)';
  this.body = marked(this.body);

  return template(this);
};

// REVIEW: There are some other functions that also relate to articles across the board, rather than
// just single instances. Object-oriented programming would call these "class-level" functions,
// that are relevant to the entire "class" of objects that are Articles.

// REVIEW: This function will take the rawData, however it is provided,
// and use it to instantiate all the articles. This code is moved from elsewhere, and
// encapsulated in a simply-named function for clarity.
Article.loadAll = function(rawData) {
  rawData.sort(function(a,b) {
    return (new Date(b.publishedOn)) - (new Date(a.publishedOn));
  });

  rawData.forEach(function(ele) {
    Article.all.push(new Article(ele));
  })
  console.log("TEST!");
}

// This function will retrieve the data from either a local or remote source,
// and process it, then hand off control to the View.
Article.fetchAll = function() {
  if (localStorage.rawData) {
    // Check if data is current
    $.ajax({
      url : 'data/hackerIpsum.json',
      type : 'HEAD',
      success : function(data, status, xhr){
        const localEtag = localStorage.etag;
        const remoteEtag = xhr.getAllResponseHeaders().split('\n').map((el) => el.split(':')).filter(el => el[0] === 'etag')[0][1];
        // console.log(xhr.getAllResponseHeaders().split('\n').map((el) => el.split(':')).filter(el => el[0] === 'etag')[0][1]);
        console.log(`localEtag = ${localEtag}`);
        console.log(`remoteEtag = ${remoteEtag}`);
        if(!(localEtag === remoteEtag)) {
          // Get current data
          $.getJSON('data/hackerIpsum.json').then(
            function(data, status, xhr){
              Article.loadAll(data);
              localStorage.rawData = JSON.stringify(data);
              localStorage.etag = xhr.getAllResponseHeaders().split('\n').map((el) => el.split(':')).filter(el => el[0] === 'etag')[0][1];
              Article.all.forEach((el) => (el.toHtml()));
              articleView.initIndexPage();
            },
            function(error){
              console.log(error);
            }
          );
        } else {
          Article.loadAll(JSON.parse(localStorage.rawData)); //TODO: DONE What do we pass in to loadAll()?
          //TODO: DONE What method do we call to render the index page
          Article.all.forEach((el) => (el.toHtml()));
          articleView.initIndexPage();
        }
      },
      error : function(error){
        console.log(error);
      }
    });
    // When rawData is already in localStorage,
    // we can load it with the .loadAll function above,
    // and then render the index page (using the proper method on the articleView object).
    Article.all.forEach((el) => (el.toHtml()));
    articleView.initIndexPage();
  } else {
    // TODO: DONE When we don't already have the rawData,
    // we need to retrieve the JSON file from the server with AJAX (which jQuery method is best for this?),
    // cache it in localStorage so we can skip the server call next time,
    // then load all the data into Article.all with the .loadAll function above,
    // and then render the index page.
    $.getJSON('data/hackerIpsum.json').then(
      function(data, status, xhr){
        Article.loadAll(data);
        localStorage.rawData = JSON.stringify(data);
        localStorage.etag = xhr.getAllResponseHeaders().split('\n').map((el) => el.split(':')).filter(el => el[0] === 'etag')[0][1];
        Article.all.forEach((el) => (el.toHtml()));
        articleView.initIndexPage();
      },
      function(error){
        console.log(error);
      }
    );
  }
}
