$(document).ready(function () {
  const itiInstances = new Map();
  $("input[name='email']").on("input", function () {
    const email = $(this).val().trim();
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!isValid) {
      $(this).addClass("error");
    } else {
      $(this).removeClass("error");
    }
  });

  $("input[name='ph_number']").on("input", function () {
    const input = this;
    const iti = itiInstances.get(input);

    if (!iti || !iti.isValidNumber()) {
      $(input).addClass("error");
    } else {
      $(input).removeClass("error");
    }
  });

  $("form").each(function () {
    const phoneInput = $(this).find("input[name='ph_number']")[0];

    if (phoneInput) {
      const iti = window.intlTelInput(phoneInput, {
        initialCountry: "auto",
        separateDialCode: true,
        nationalMode: false,
        geoIpLookup: function (callback) {
          $.get("https://api.db-ip.com/v2/free/self", function (resp) {
            const countryCode = resp.countryCode || "ES";
            callback(countryCode);
          });
        },
        utilsScript:
          "https://cdn.jsdelivr.net/npm/intl-tel-input@23.3.2/build/js/utils.js",
      });

      itiInstances.set(phoneInput, iti);
    }
  });

  $("form").on("submit", function (e) {
    e.preventDefault();

    const $form = $(this);
    const phoneInput = $form.find("input[name='ph_number']")[0];
    const iti = itiInstances.get(phoneInput);

    let valid = true;

    const firstName = $form.find("input[name='first_name']");
    const lastName = $form.find("input[name='last_name']");
    const email = $form.find("input[name='email']");
    const phone = $form.find("input[name='ph_number']");

    // Скидаємо попередні помилки
    $form.find("input").removeClass("error");

    if (firstName.val().trim().length < 2) {
      firstName.addClass("error");
      valid = false;
    }

    if (lastName.val().trim().length < 2) {
      lastName.addClass("error");
      valid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.val().trim())) {
      email.addClass("error");
      valid = false;
    }

    if (!iti || !iti.isValidNumber()) {
      phone.addClass("error");
      valid = false;
    }

    if (!valid) return;

    $.get("https://api.db-ip.com/v2/free/self", function (resp) {
      const ip = resp.ipAddress;

      const countryData = iti.getSelectedCountryData();
      const selected_country_code = countryData ? countryData.iso2 : "en";
      localStorage.setItem("selectedCountryCode", selected_country_code);

      const getSafeVal = (selector, fallback) => {
        const el = $form.find(selector);
        return el.length && el.val().trim() !== "" ? el.val() : fallback;
      };
      const data = {
        first_name: firstName.val(),
        last_name: lastName.val(),
        email: email.val(),
        phone: iti ? iti.getNumber() : phone.val(),
        buyer_id: getSafeVal("input[name='wi']", "missed"),
        account_id: getSafeVal("input[name='acc']", "missed"),
        funnel_name: document.title,
        domain: location.hostname,
        ip: ip,
        clickid: $form.find("input[name='subid']").val(),
        country: selected_country_code.toUpperCase(),
        fb_pixel: getSafeVal("input[name='fbp']", "missed"),
        fb_token: getSafeVal("input[name='fbtoken']", "missed"),
        fbclid: getSafeVal("input[name='fbclid']", "missed"),
        google_tag: getSafeVal("input[name='gtm']", "missed"),
      };

      fetch("https://techjourheydigital.ink/lead-handler.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
        .then((res) => res.json())
        .then((response) => {
          console.log("✅ Success:", response);
          if (response.success) {
            const redirectUrl = response.redirectUrl || "";

            localStorage.setItem("finalRedirect", redirectUrl);

            Swal.fire({
              icon: "success",
              title: "Application accepted!",
              text: "You will now be redirected...",
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true,
            });

            setTimeout(() => {
              const redirectParams = new URLSearchParams({
                lang: selected_country_code,
              });

              if (data.fb_pixel && data.fb_pixel !== "missed") {
                redirectParams.append("fbp", data.fb_pixel);
              }

              if (data.google_tag && data.google_tag !== "missed") {
                redirectParams.append("gtm", data.google_tag);
              }

              window.location.href = `thank_you/index.php?${redirectParams.toString()}`;
            }, 3000);
          } else {
            Swal.fire({
              icon: "error",
              title: "Error",
              text: "Something went wrogn. Try again.",
            });
          }
        })
        .catch((error) => {
          console.error("❌ Error:", error);
          Swal.fire({
            icon: "error",
            title: "Network Error",
            text: "The application could not be submitted. Please try again.",
          });
        });
    });
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const wi = urlParams.get("wi") || "missed";
  const acc = urlParams.get("acc") || "missed";
  const gtm = urlParams.get("gtm") || "null";
  const fbp = urlParams.get("fbp") || "null";
  const fbtoken = urlParams.get("fbtoken") || "null";
  const fbclid = urlParams.get("fbclid") || "null";

  document.querySelectorAll("form").forEach((form) => {
    let wiInput = form.querySelector("input[name='wi']");
    if (!wiInput) {
      wiInput = document.createElement("input");
      wiInput.type = "hidden";
      wiInput.name = "wi";
      form.appendChild(wiInput);
    }
    wiInput.value = wi;

    let accInput = form.querySelector("input[name='acc']");
    if (!accInput) {
      accInput = document.createElement("input");
      accInput.type = "hidden";
      accInput.name = "acc";
      form.appendChild(accInput);
    }
    accInput.value = acc;

    let gtmInput = form.querySelector("input[name='gtm']");
    if (!gtmInput) {
      gtmInput = document.createElement("input");
      gtmInput.type = "hidden";
      gtmInput.name = "gtm";
      form.appendChild(gtmInput);
    }
    gtmInput.value = gtm;

    let fbpInput = form.querySelector("input[name='fbp']");
    if (!fbpInput) {
      fbpInput = document.createElement("input");
      fbpInput.type = "hidden";
      fbpInput.name = "fbp";
      form.appendChild(fbpInput);
    }
    fbpInput.value = fbp;

    let fbtokenInput = form.querySelector("input[name='fbtoken']");
    if (!fbtokenInput) {
      fbtokenInput = document.createElement("input");
      fbtokenInput.type = "hidden";
      fbtokenInput.name = "fbtoken";
      form.appendChild(fbtokenInput);
    }
    fbtokenInput.value = fbtoken;

    let fbclidInput = form.querySelector("input[name='fbclid']");
    if (!fbclidInput) {
      fbclidInput = document.createElement("input");
      fbclidInput.type = "hidden";
      fbclidInput.name = "fbclid";
      form.appendChild(fbclidInput);
    }
    fbclidInput.value = fbclid;
  });
});
