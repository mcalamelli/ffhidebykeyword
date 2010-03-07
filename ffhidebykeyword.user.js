// ==UserScript==
// @name           FriendFeedHideByKeyword
// @namespace      http://www.mcalamelli.net
// @description    Hide posts using keywords
// @include        http://friendfeed.com/*
// @match          http://friendfeed.com/*
// @run-at document-start
// @version        0.6.7
// ==/UserScript==

// pushing the array that contains the keywords
var v = document.createElement("script");
v.setAttribute("type","text/javascript");
v.innerHTML = "var keywordArray = new Array();";
document.body.appendChild(v);

// hide posts using selected keyword
// kw: the keyword
// fresh: is this a new hide, or we're hiding using an existing keyword?
function hide(kw, fresh) {
   var posts = document.getElementsByClassName("text");
   var re = new RegExp(kw, "i");
   var hideCount = 0;

   // walking through posts to search unwanted keyword
   for (var i = 0; i <= posts.length - 1; i++) {
      var entry = posts[i].innerHTML;
      if ((entry.search(re) != -1) && (kw != "")){
         // keyword found
         hideCount++;
         // get the post
         var hiddenEntry = posts[i].parentNode.parentNode.parentNode.parentNode;
         
         // set a fake id
         hiddenEntry.setAttribute("name", kw);
         
         // and hide it
         hiddenEntry.style.visibility="hidden";
         hiddenEntry.style.display="none";
         //hiddenEntry.style.border="1px solid red"; // debug
      } else {
         if (fresh == false) {
            // keyword not found, but fresh is false, so this call came from 
            // a page refresh & cookie. i've to remove unmatched keyword
            /* This piece of code could be useful, i'll keep commented
            var ii = keywordArray.indexOf(kw);
            keywordArray.splice(ii, 1);
            storeKeywordsInCookie(keywordArray.join(","));
            */
         }
      }
   }

   if (hideCount != 0) {
      // unwanted keyword detected, add keyword to the keyword's list
      if (true == fresh) {
         if (!window.chrome) {
            // Firefox
            document.getElementById("hbkw").innerHTML += "<p id=\"id" + kw + "\" class=\"hkw\" style=\"margin:0pt\">" + kw + " (" + hideCount + ")  [<a href=\"#\" onclick=\"unhide('" + kw + "')\">Unhide</a>]</p>";
         } else {
            // Chrome
            var hbkw = document.getElementById("hbkw");
            var _p = document.createElement("p");
            _p.setAttribute("id", "id" + kw);
            _p.setAttribute("class", "hkw");
            _p.setAttribute("style", "margin:0pt");
            _p.innerHTML = kw + " (" + hideCount + ")  [";
            var _a = document.createElement("a");
            _a.setAttribute("href","#");
            _a.setAttribute("onclick","unhide('" + kw +"')");
            _a.innerText += "Unhide";
            _p.appendChild(_a);
            _p.innerHTML += "]";
            hbkw.appendChild(_p);
         }
      } else {
         // we're hiding a new post using existing keyword, we've to update hidden count
         var hiddenCount = parseInt(document.getElementById("id" + kw).innerHTML.match(/[0-9]+/));
         document.getElementById("id" + kw).innerHTML = document.getElementById("id" + kw).innerHTML.replace(/[0-9]+/, (hiddenCount + 1).toString());
      }
      // and reset text entry
      document.getElementById("kw").value = "";
      
      // place here the writing of persistent storage (cookie)
      keywordArray.push(kw);
      storeKeywordsInCookie(keywordArray.join(","));
      return true;
   }
   return false;
}

// unhide previously hidden posts
function unhide(kw) {
   // get posts affected by keyword
   var hiddenElements = document.getElementsByName(kw);
   
   // and unhide it
   for (var i = 0; i < hiddenElements.length; i++) {
      hiddenElements[i].style.visibility = "visible";
      hiddenElements[i].style.display = "block";
      //hiddenElements[i].style.border="none"; // debug
      //hiddenElements[i].removeAttribute("name"); // removing it not all hidden elements will be shown again
   }
   
   // remove the keyword from the list
   var currentKeyword = document.getElementById("id" + kw);
   currentKeyword.parentNode.removeChild(currentKeyword);
   
   // update the array of keywords
   var ii = keywordArray.indexOf(kw);
   keywordArray.splice(ii, 1);
   storeKeywordsInCookie(keywordArray.join(","));
}

// check for keywords in a new post
function checkNewPost(txt) {
   var kwList = document.getElementsByClassName("hkw");
   
   for (var i = 0; i < kwList.length; i++) {
      var kw = kwList[i].getAttribute("id").substr(2);
      var re = new RegExp(kw, "i");
      if (txt.search(re) != -1) {
         hide(kw, false);
         break;
      }
   }
}

// store the keywords into a cookie for a future use (aka refresh)
function storeKeywordsInCookie(kws) {
   var _now = new Date();
   var _exp = new Date();
   _exp.setTime(_now.getTime() + 20*365*24*60*60*1000);
   document.cookie = "ffhbk_kws" + "=" + kws + "" + "; path=/; expires=" + _exp.toGMTString();
}

// restore the keywords from the cookie
function restoreKeywordsFromCookie() {
	var cookieName = "ffhbk_kws=";
	var cookieArray = document.cookie.split(';');
	
   for (var i = 0; i < cookieArray.length; i++) { 
		var cookie = cookieArray[i];
		while (cookie.charAt(0) == ' ')
			cookie = cookie.substring(1, cookie.length);
		if (cookie.indexOf(cookieName) == 0) {
			var kws = cookie.substring(cookieName.length, cookie.length);
         return kws;
      }
	}
	return null;
}

// iterate into stored keywords and try to hide annoying posts
function hidePostsFromStoredKeywords() {
   var sKeywordsFromCookie = restoreKeywordsFromCookie();
   if (sKeywordsFromCookie != null) {
      var aKeywordsFromCookie = sKeywordsFromCookie.split(",");
      for (var ii = 0; ii < aKeywordsFromCookie.length; ii++)
         hide(aKeywordsFromCookie[ii], true);
   }
}

// push local function into DOM 
function embedInDOM(s) {
   var scpt = document.createElement('script');
   scpt.setAttribute("type","text/javascript");
   scpt.innerHTML = s.toString().replace(/([\s\S]*?return;){2}([\s\S]*)}/,'$2');
   document.body.appendChild(scpt);
}

//******************************************

// Push hide(kw) into the DOM
embedInDOM(hide);
// Push unhide(kw) into the DOM
embedInDOM(unhide);
// Push checkNewPost(txt) into the DOM
embedInDOM(checkNewPost);
// Push storeKeywordsInCookie(kws) into the DOM
embedInDOM(storeKeywordsInCookie);
// Push restoreKeywordsFromCookie() into the DOM
embedInDOM(restoreKeywordsFromCookie); 
// Push hidePostsFromStoredKeywords() into the DOM
embedInDOM(hidePostsFromStoredKeywords);

// Detect useful DOM elements
var FFSidebar = document.getElementById("sidebar");
var FFBox = FFSidebar.getElementsByClassName("box");
var FFBoxBody = FFBox[0].getElementsByClassName("box-body");
var FFSection = FFBoxBody[0].childNodes[1];

// Create a new section...
var hbkwSect = document.createElement("div");
// ...and set up class and ID...
hbkwSect.setAttribute("class", "section");
hbkwSect.setAttribute("id", "hbkw");
// ...and add HTML elements...
hbkwSect.innerHTML = "<input type=\"text\" id=\"kw\" size=\"11\">";
hbkwSect.innerHTML += "&nbsp;<a href=\"#\" onclick=\"hide(document.getElementById('kw').value, true)\">Hide</a>";
hbkwSect.innerHTML += "<script language=\"Javascript\">hidePostsFromStoredKeywords();</script>";
// ...and insert into the DOM...
FFBoxBody[0].insertBefore(hbkwSect, FFSection.nextSibling);

// add a listener for DOM changes
document.addEventListener('DOMNodeInserted', function (event) {
   var eventTarget = event.target;
   if (eventTarget.toString() == "[object HTMLDivElement]") {
      var targetClass = eventTarget.getAttribute("class");
      if (("l_entry entry" == targetClass) || ("l_entry entry private" == targetClass)) {
         // new post. ok, a rescan is needed now
         checkNewPost(eventTarget.getElementsByClassName("body")[0].getElementsByClassName("ebody")[0].getElementsByClassName("title")[0].getElementsByClassName("text")[0].innerHTML);
      }
   }
}, false);