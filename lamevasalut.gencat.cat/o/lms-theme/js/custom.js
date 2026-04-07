window.go2 = function (url) {
  location.replace(url);
};

window.cipFormat = function (value) {
  var v = value.replace(/\s+/g, "");
  if (v.length > 4) v = [v.slice(0, 4), " ", v.slice(4)].join("");
  if (v.length > 6) v = [v.slice(0, 6), " ", v.slice(6)].join("");
  if (v.length > 13) v = [v.slice(0, 13), " ", v.slice(13)].join("");
  if (v.length > 16) v = [v.slice(0, 16), " ", v.slice(16)].join("");
  if (v.length > 18) v = v.slice(0, 18);
  return v.toUpperCase();
};

/**
 * Comprobacio de la sessio per descarregar docs
 * @returns
 */
function checkLiferaySessionForDownload(id){
	var sessionActive = Liferay.Session.get("sessionState");
	var link = document.getElementById(id);
	//	fem reload per automaticament anar al login
	if(sessionActive === "expired") {
		link.setAttribute("target", "_self");
		link.href="/web/cps/login";
		return false;
	} else {
		link.setAttribute("target", "_blank");
		return true;
	}
}

$(document).ready(function () {
  /*
   * Registro de "serviceWorker" para convertir el proyecto en PWA.
   */
  window.go2 = function (url) {
    location.replace(url);
  };

  window.cipFormat = function (value) {
    var v = value.replace(/\s+/g, "");
    if (v.length > 4) v = [v.slice(0, 4), " ", v.slice(4)].join("");
    if (v.length > 6) v = [v.slice(0, 6), " ", v.slice(6)].join("");
    if (v.length > 13) v = [v.slice(0, 13), " ", v.slice(13)].join("");
    if (v.length > 16) v = [v.slice(0, 16), " ", v.slice(16)].join("");
    if (v.length > 18) v = v.slice(0, 18);
    return v.toUpperCase();
  };

  window.dateFormat = function (value, keycode) {
    if (keycode == 8 || keycode == 46) {
      return value;
    }
    var v = value.replace(/[^0-9]/g, "").slice(0, 8);
    if (v.length > 1) {
      v = [v.slice(0, 2), "/", v.slice(2)].join("");
    }
    if (v.length > 4) {
      v = [v.slice(0, 5), "/", v.slice(5)].join("");
    }
    return v;
  };

  window.openUserNav = function () {
    document.getElementsByClassName("menu-perfil-capa")[0].style.visibility =
      "visible";
    document.getElementsByClassName("menu-perfil-capa")[0].style.opacity = "1";
    document.getElementsByClassName(
      "menu-perfil-container"
    )[0].style.visibility = "visible";
    document.getElementsByClassName("menu-perfil-container")[0].style.opacity =
      "1";
    document.getElementsByTagName("html")[0].style.overflow = "hidden";
  };

  window.closeUserNav = function () {
    document.getElementsByClassName("menu-perfil-container")[0].style.opacity =
      "0";
    document.getElementsByClassName(
      "menu-perfil-container"
    )[0].style.visibility = "hidden";
    document.getElementsByClassName("menu-perfil-capa")[0].style.opacity = "0";
    document.getElementsByClassName("menu-perfil-capa")[0].style.visibility =
      "hidden";
    document.getElementsByTagName("html")[0].style.overflow = "auto";
  };

  if ($(".faq-container").length) {
    $(".faq-container ul li").on({
      click: function () {
        if ($(this).attr("aria-expanded") == "false") {
          this.style.backgroundImage =
            'url("/o/lms-theme/images/icons/plus/minus-circle-grey.svg")';
        } else {
          this.style.backgroundImage =
            'url("/o/lms-theme/images/icons/plus/mes-circle-grey.svg")';
        }
      },
    });
  }

  if ($("#content").length) {
    if ($(".app").length == 0) {
      if ($("#trackingCookie").length) {
        if ($.cookie("cookiesCPS") == null) {
          $("#trackingCookie").show();
        }
      }

      $("#tancarAvisCookies").click(function (e) {
        $("#trackingCookie").hide();
        $.cookie("cookiesCPS", true, { expires: 7, path: "/" });
      });
    }
  }

  if ($("#navegacion").length) {
    $(".logo-plus").on({
      click: function () {
        $(this)
          .next()
          .on("hide.bs.collapse", function () {
            $(this)
              .prev()
              .attr(
                "src",
                "/o/lms-theme/images/icons/plus/mes-circle-grey.svg"
              );
          });
        $(this)
          .next()
          .on("show.bs.collapse", function () {
            $(this)
              .prev()
              .attr(
                "src",
                "/o/lms-theme/images/icons/plus/minus-circle-grey.svg"
              );
          });
      },
    });
  }

  if ($("#page-prehome").length) {
    $("#lmsNombreUsuario").text(lmsUserName);
  }

  if ($("#page-tour").length) {
    $(".single-item").slick({
      infinite: true,
      arrows: true,
      dots: true,
      adaptiveHeight: true,
      autoplay: true,
      autoplaySpeed: 7500,
      nextArrow:
        "<button type='button' class='slick-next pull-right'><img src='/o/lms-theme/images/icons/atras-black.svg' alt='Navigation right'></button>",
      prevArrow:
        "<button type='button' class='slick-prev pull-left'><img src='/o/lms-theme/images/icons/atras-black.svg' alt='Navigation left'></button>",
    });
  }

  if ($("#triarperfil").length) {
    if (window.location.pathname == "/group/cps/triar-perfil") {
      $("#menu-usuario-header").hide();
    }
  }

  if ($(".preguntes-faq-container").length) {
    function toggleIcon(e) {
      $(e.target).prev().toggleClass('icono-mes icono-minus');
    }

    $('.preguntes-faq-container').on('hide.bs.collapse', toggleIcon);
    $('.preguntes-faq-container').on('show.bs.collapse', toggleIcon);
  } 
  
});