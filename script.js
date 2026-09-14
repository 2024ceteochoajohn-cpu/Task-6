const KEY = {
  customers: 'caterring_customers',
  admins: 'caterring_admins',
  bookings: 'caterring_bookings',
  payments: 'caterring_payments'
};


const $ = id => document.getElementById(id);


const get = (key, defaultValue = []) => {

  try {

    return JSON.parse(
      localStorage.getItem(key)
    ) ?? defaultValue;

  } catch {

    return defaultValue;

  }

};


const set = (key, value) => {

  localStorage.setItem(
    key,
    JSON.stringify(value)
  );

};


let selectedRole = 'admin';

let currentUser = null;


let customers = get(KEY.customers);

let admins = get(KEY.admins);

let bookings = get(KEY.bookings);

let payments = get(KEY.payments);


/* =====================================================
   DEFAULT ADMIN ACCOUNT
===================================================== */

if (!admins.length) {

  admins = [

    {
      name: 'System Administrator',
      username: 'admin',
      email: 'admin@caterring.com',
      password: 'Admin123'
    }

  ];

  set(KEY.admins, admins);

}


/*
   Migration for older admin accounts
*/

admins = admins.map(admin => {

  if (admin.username) {

    return admin;

  }

  return {
    ...admin,
    username: 'admin'
  };

});

set(KEY.admins, admins);


/* =====================================================
   VALIDATION REGEX
===================================================== */


/*
   First Name / Middle Name / Last Name

   Allowed:
   - Letters
   - Spaces

   Not allowed:
   - Numbers
   - Special characters
   - Hyphen
   - Underscore
   - @
   - #
*/

const nameOK = value => {

  return /^[A-Za-zÀ-ÿ]+(?: [A-Za-zÀ-ÿ]+)*$/.test(
    value
  );

};


/*
   Username:
   Letters and numbers only.
*/

const usernameOK = value => {

  return /^[A-Za-z0-9]+$/.test(
    value
  );

};


/*
   Email:
   Any valid email domain is allowed.
*/

const emailOK = value => {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  );

};


/*
   Philippine mobile number:
   09XXXXXXXXX
   11 digits
*/

const phoneOK = value => {

  return /^09[0-9]{9}$/.test(
    value
  );

};


/*
   Password:
   - Minimum 8 characters
   - NO maximum
   - Letters and numbers only
*/

const passwordOK = value => {

  return /^[A-Za-z0-9]+$/.test(value)
    && value.length >= 8;

};


/* =====================================================
   REAL-TIME LETTERS-ONLY RESTRICTION
===================================================== */


/*
   This function prevents numbers and special characters
   while the user is typing.

   It is applied to:

   - First Name
   - Middle Name
   - Last Name
   - Admin Full Name

   Allowed:
   A-Z
   a-z
   accented letters
   spaces

   The input event also removes invalid characters
   that may enter through autofill or other methods.

   Paste is also filtered.
*/

function allowLettersOnly(input) {

  if (!input) {
    return;
  }


  /*
     KEYBOARD RESTRICTION
  */

  input.addEventListener(
    'keydown',
    function (event) {

      const allowedKeys = [

        'Backspace',
        'Delete',
        'Tab',

        'ArrowLeft',
        'ArrowRight',

        'ArrowUp',
        'ArrowDown',

        'Home',
        'End'

      ];


      /*
         Allow keyboard shortcuts such as:

         Ctrl + A
         Ctrl + C
         Ctrl + V
         Ctrl + X
      */

      if (
        allowedKeys.includes(event.key)
        || event.ctrlKey
        || event.metaKey
      ) {

        return;

      }


      /*
         Only letters and spaces.
      */

      if (
        !/^[A-Za-zÀ-ÿ ]$/.test(
          event.key
        )
      ) {

        event.preventDefault();

      }

    }
  );


  /*
     REAL-TIME INPUT FILTER

     Example:

     Juan123
     becomes:

     Juan
  */

  input.addEventListener(
    'input',
    function () {

      input.value =
        input.value.replace(
          /[^A-Za-zÀ-ÿ ]/g,
          ''
        );

    }
  );


  /*
     PASTE FILTER

     Example pasted:

     Juan123@#

     becomes:

     Juan
  */

  input.addEventListener(
    'paste',
    function (event) {

      event.preventDefault();


      const text =
        (
          event.clipboardData
          || window.clipboardData
        ).getData('text');


      const cleanText =
        text.replace(
          /[^A-Za-zÀ-ÿ ]/g,
          ''
        );


      const start =
        input.selectionStart
        ?? input.value.length;


      const end =
        input.selectionEnd
        ?? input.value.length;


      input.value =
        input.value.slice(0, start)
        + cleanText
        + input.value.slice(end);


      input.dispatchEvent(
        new Event(
          'input',
          {
            bubbles: true
          }
        )
      );

    }
  );

}


/* =====================================================
   DATE
===================================================== */

const today = () => {

  return new Date()
    .toISOString()
    .split('T')[0];

};


/* =====================================================
   TOAST
===================================================== */

function toast(
  message,
  type = 'ok'
) {

  const toastElement = $('toast');

  toastElement.textContent = message;

  toastElement.className =
    'toast show ' + type;

  clearTimeout(
    window._toast
  );

  window._toast =
    setTimeout(
      () => {

        toastElement.className =
          'toast';

      },
      3200
    );

}


/* =====================================================
   FIELD ERROR
===================================================== */

function error(
  input,
  message
) {

  const errorElement =
    input
      .closest('.field')
      ?.querySelector('.error');


  if (errorElement) {

    errorElement.textContent =
      message;

  }


  input.classList.toggle(
    'invalid',
    !!message
  );


  input.classList.toggle(
    'valid',
    !message && !!input.value
  );

}


/* =====================================================
   CLEAR ERRORS
===================================================== */

function clearErrors(form) {

  form
    .querySelectorAll('.error')
    .forEach(
      element => {

        element.textContent = '';

      }
    );


  form
    .querySelectorAll(
      '.invalid,.valid'
    )
    .forEach(
      element => {

        element.classList.remove(
          'invalid',
          'valid'
        );

      }
    );

}


/* =====================================================
   BASIC FIELD VALIDATION
===================================================== */

function basicField(input) {

  if (!input) {

    return true;

  }


  const value =
    input.value.trim();


  /*
     Required field
  */

  if (
    input.required
    && !value
  ) {

    error(
      input,
      'This field is required.'
    );

    return false;

  }


  /*
     Optional empty field
  */

  if (!value) {

    error(
      input,
      ''
    );

    return true;

  }


  /*
     Email
  */

  if (
    input.type === 'email'
    && !emailOK(value)
  ) {

    error(
      input,
      'Enter a valid email address.'
    );

    return false;

  }


  /*
     Pattern
  */

  if (
    input.pattern
    && input.type !== 'password'
  ) {

    const regex =
      new RegExp(
        '^' + input.pattern + '$'
      );


    if (!regex.test(value)) {

      error(
        input,
        'Invalid format.'
      );

      return false;

    }

  }


  /*
     Number min/max
  */

  if (
    input.type === 'number'
    &&
    (
      (
        input.min
        && Number(value)
        < Number(input.min)
      )
      ||
      (
        input.max
        && Number(value)
        > Number(input.max)
      )
    )
  ) {

    error(
      input,
      'Enter a valid number.'
    );

    return false;

  }


  /*
     Minimum length
  */

  if (
    input.minLength > 0
    && value.length < input.minLength
  ) {

    error(
      input,
      `Minimum ${input.minLength} characters.`
    );

    return false;

  }


  error(
    input,
    ''
  );


  return true;

}


/* =====================================================
   FORM VALIDATION
===================================================== */

function validateForm(form) {

  let valid = true;


  form
    .querySelectorAll(
      'input,select,textarea'
    )
    .forEach(
      input => {

        /*
           Middle name is optional.
           Skip validation when empty.
        */

        if (
          input.id ===
          'regMiddleName'
        ) {

          return;

        }


        if (
          !basicField(input)
        ) {

          valid = false;

        }

      }
    );


  return valid;

}


/* =====================================================
   ROLE SELECTION
===================================================== */

function selectRole(role) {

  selectedRole = role;


  $('adminRoleBtn')
    .classList
    .toggle(
      'active',
      role === 'admin'
    );


  $('customerRoleBtn')
    .classList
    .toggle(
      'active',
      role === 'customer'
    );


  $('loginEmail').placeholder =
    role === 'admin'
      ? 'Admin email or username'
      : 'Customer email or username';

}


$('adminRoleBtn').onclick =
  () => selectRole('admin');


$('customerRoleBtn').onclick =
  () => selectRole('customer');


/* =====================================================
   CUSTOMER REGISTRATION MODAL
===================================================== */

$('createAccountButton').onclick =
  () => {

    $('customerRegisterModal')
      .classList
      .remove('hidden');


    $('customerRegisterModal')
      .setAttribute(
        'aria-hidden',
        'false'
      );

  };


$('customerRegisterModal')
  .addEventListener(
    'click',
    function (event) {

      const id =
        event.target.dataset.close;


      if (id) {

        $(id)
          .classList
          .add('hidden');


        $(id)
          .setAttribute(
            'aria-hidden',
            'true'
          );

      }

    }
  );


/* =====================================================
   PASSWORD SHOW/HIDE
===================================================== */

document
  .querySelectorAll('.eye')
  .forEach(
    button => {

      button.onclick =
        () => {

          const input =
            $(button.dataset.target);


          input.type =
            input.type === 'password'
              ? 'text'
              : 'password';


          button.textContent =
            input.type === 'password'
              ? '👁'
              : '🙈';

        };

    }
  );


/* =====================================================
   DATE INPUT RESTRICTION
===================================================== */

document
  .querySelectorAll(
    'input[type=date]'
  )
  .forEach(
    input => {

      if (
        input.id ===
        'regBirthDate'
      ) {

        input.max = today();

      }


      /*
         Prevent manually typing dates.
         The native date picker remains available.
      */

      input.addEventListener(
        'keydown',
        event => {

          event.preventDefault();

        }
      );


      input.addEventListener(
        'paste',
        event => {

          event.preventDefault();

        }
      );

    }
  );


/* =====================================================
   LIVE FORM VALIDATION
===================================================== */

document
  .querySelectorAll(
    'input,select,textarea'
  )
  .forEach(
    input => {

      input.addEventListener(
        'input',
        function () {

          if (
            input.id !==
            'loginEmail'
          ) {

            basicField(input);

          }

        }
      );

    }
  );


/* =====================================================
   APPLY REAL-TIME LETTERS-ONLY
===================================================== */


/*
   CUSTOMER REGISTRATION:

   First Name
   Middle Name
   Last Name

   ADMIN:

   Full Name
*/

[
  'regFirstName',
  'regMiddleName',
  'regLastName',
  'adminName'
].forEach(
  id => {

    allowLettersOnly(
      $(id)
    );

  }
);


/* =====================================================
   CUSTOMER REGISTRATION
===================================================== */

$('customerRegisterForm')
  .addEventListener(
    'submit',
    function (event) {

      event.preventDefault();


      const form =
        event.currentTarget;


      clearErrors(form);


      let valid =
        validateForm(form);


      const first =
        $('regFirstName')
          .value
          .trim();


      const last =
        $('regLastName')
          .value
          .trim();


      const middle =
        $('regMiddleName')
          .value
          .trim();


      const gender =
        $('regGender').value;


      const birth =
        $('regBirthDate').value;


      const phone =
        $('regPhone')
          .value
          .trim();


      const email =
        $('regEmail')
          .value
          .trim()
          .toLowerCase();


      const username =
        $('regUsername')
          .value
          .trim();


      const password =
        $('regPassword').value;


      const confirmPassword =
        $('regConfirmPassword').value;


      /* NAME VALIDATION */

      if (!nameOK(first)) {

        error(
          $('regFirstName'),
          'Letters and spaces only.'
        );

        valid = false;

      }


      if (!nameOK(last)) {

        error(
          $('regLastName'),
          'Letters and spaces only.'
        );

        valid = false;

      }


      /*
         Middle name is optional.
         Validate only when not blank.
      */

      if (
        middle
        && !nameOK(middle)
      ) {

        error(
          $('regMiddleName'),
          'Letters and spaces only.'
        );

        valid = false;

      }


      /* USERNAME */

      if (
        !usernameOK(username)
      ) {

        error(
          $('regUsername'),
          'Username may contain letters and numbers only.'
        );

        valid = false;

      }


      /* EMAIL */

      if (
        !emailOK(email)
      ) {

        error(
          $('regEmail'),
          'Enter a valid email address.'
        );

        valid = false;

      }


      /* PHONE */

      if (
        !phoneOK(phone)
      ) {

        error(
          $('regPhone'),
          'Use 09XXXXXXXXX (11 digits).'
        );

        valid = false;

      }


      /* PASSWORD */

      if (
        !passwordOK(password)
      ) {

        error(
          $('regPassword'),
          'Password must be 8 or more characters and use letters/numbers only.'
        );

        valid = false;

      }


      /* CONFIRM PASSWORD */

      if (
        password !== confirmPassword
      ) {

        error(
          $('regConfirmPassword'),
          'Passwords do not match.'
        );

        valid = false;

      }


      /* BIRTH DATE */

      if (
        birth
        && birth > today()
      ) {

        error(
          $('regBirthDate'),
          'Birth date cannot be in the future.'
        );

        valid = false;

      }


      /* DUPLICATE EMAIL */

      if (
        customers.some(
          customer =>
            customer.email?.toLowerCase()
            === email
        )
        ||
        admins.some(
          admin =>
            admin.email?.toLowerCase()
            === email
        )
      ) {

        error(
          $('regEmail'),
          'Email is already registered.'
        );

        valid = false;

      }


      /* DUPLICATE USERNAME */

      if (
        customers.some(
          customer =>
            customer.username?.toLowerCase()
            === username.toLowerCase()
        )
        ||
        admins.some(
          admin =>
            admin.username?.toLowerCase()
            === username.toLowerCase()
        )
      ) {

        error(
          $('regUsername'),
          'Username is already taken.'
        );

        valid = false;

      }


      /* TERMS */

      if (
        !$('regTerms').checked
      ) {

        toast(
          'Please confirm that your information is correct.',
          'error'
        );

        valid = false;

      }


      if (!valid) {

        toast(
          'Please correct the highlighted fields.',
          'error'
        );

        return;

      }


      /* CREATE CUSTOMER ACCOUNT */

      const account = {

        name:
          [
            first,
            middle,
            last
          ]
          .filter(Boolean)
          .join(' '),

        firstName:
          first,

        middleName:
          middle,

        lastName:
          last,

        email:
          email,

        phone:
          phone,

        gender:
          gender,

        birthDate:
          birth,

        username:
          username,

        password:
          password

      };


      customers.push(
        account
      );


      set(
        KEY.customers,
        customers
      );


      form.reset();


      $('customerRegisterModal')
        .classList
        .add('hidden');


      $('customerRegisterModal')
        .setAttribute(
          'aria-hidden',
          'true'
        );


      $('loginEmail').value =
        email;


      selectRole(
        'customer'
      );


      toast(
        'Customer account created successfully. You can now log in.'
      );


      renderCustomers();

    }
  );


/* =====================================================
   LOGIN
===================================================== */

$('loginForm')
  .addEventListener(
    'submit',
    function (event) {

      event.preventDefault();


      const identity =
        $('loginEmail')
          .value
          .trim();


      const password =
        $('loginPassword').value;


      clearErrors(
        event.currentTarget
      );


      let valid = true;


      if (!identity) {

        error(
          $('loginEmail'),
          'Email or username is required.'
        );

        valid = false;

      }


      if (
        !passwordOK(password)
      ) {

        error(
          $('loginPassword'),
          'Password must be 8+ characters and letters/numbers only.'
        );

        valid = false;

      }


      if (!valid) {

        return;

      }


      /*
         IMPORTANT:

         Admin login checks ONLY admins.

         Customer login checks ONLY customers.
      */

      const store =
        selectedRole === 'admin'
          ? admins
          : customers;


      const user =
        store.find(
          account =>

            (
              account.email?.toLowerCase()
              === identity.toLowerCase()

              ||

              account.username?.toLowerCase()
              === identity.toLowerCase()
            )

            &&

            account.password ===
            password
        );


      if (!user) {

        toast(

          selectedRole === 'admin'

            ? 'Admin account not found or password is incorrect.'

            : 'Customer account not found or password is incorrect.',

          'error'

        );

        return;

      }


      currentUser = {

        ...user,

        role:
          selectedRole

      };


      /* REMEMBER ME */

      if (
        $('rememberMe').checked
      ) {

        localStorage.setItem(
          'cateringLoginEmail',
          identity
        );

      } else {

        localStorage.removeItem(
          'cateringLoginEmail'
        );

      }


      $('loginPage')
        .classList
        .add('hidden');


      /* ADMIN */

      if (
        selectedRole === 'admin'
      ) {

        /*
           Extra check to ensure
           authenticated user exists
           in admin store.
        */

        if (
          !admins.some(
            admin =>
              admin.username ===
              user.username
              ||
              admin.email ===
              user.email
          )
        ) {

          logout();

          return;

        }


        $('adminPage')
          .classList
          .remove('hidden');


        showAdminSection(
          'adminDashboard'
        );


        updateAdmin();

      }


      /* CUSTOMER */

      else {

        $('customerPage')
          .classList
          .remove('hidden');


        showCustomerSection(
          'customerDashboard'
        );


        updateCustomer();

      }

    }
  );


/* =====================================================
   ADMIN NAVIGATION
===================================================== */

function showAdminSection(id) {

  document
    .querySelectorAll(
      '#adminPage .page-section'
    )
    .forEach(
      section => {

        section.classList.toggle(
          'hidden',
          section.id !== id
        );

      }
    );


  document
    .querySelectorAll(
      '#adminNav a'
    )
    .forEach(
      link => {

        link.classList.toggle(
          'active',
          link.dataset.section === id
        );

      }
    );


  const link =
    document.querySelector(
      `#adminNav a[data-section="${id}"]`
    );


  if (link) {

    $('adminSectionTitle')
      .textContent =
      link.textContent
        .replace(
          /^\S+\s/,
          ''
        );

  }

}


/* =====================================================
   CUSTOMER NAVIGATION
===================================================== */

function showCustomerSection(id) {

  document
    .querySelectorAll(
      '#customerPage .page-section'
    )
    .forEach(
      section => {

        section.classList.toggle(
          'hidden',
          section.id !== id
        );

      }
    );


  document
    .querySelectorAll(
      '#customerNav a'
    )
    .forEach(
      link => {

        link.classList.toggle(
          'active',
          link.dataset.section === id
        );

      }
    );


  const link =
    document.querySelector(
      `#customerNav a[data-section="${id}"]`
    );


  if (link) {

    $('customerSectionTitle')
      .textContent =
      link.textContent
        .replace(
          /^\S+\s/,
          ''
        );

  }

}


/* NAV CLICK */

document
  .querySelectorAll(
    '#adminNav a'
  )
  .forEach(
    link => {

      link.onclick =
        () => {

          showAdminSection(
            link.dataset.section
          );

        };

    }
  );


document
  .querySelectorAll(
    '#customerNav a'
  )
  .forEach(
    link => {

      link.onclick =
        () => {

          showCustomerSection(
            link.dataset.section
          );

        };

    }
  );


/* BUTTON NAVIGATION */

document
  .querySelectorAll(
    '[data-section-target]'
  )
  .forEach(
    button => {

      button.onclick =
        () => {

          const id =
            button.dataset.sectionTarget;


          if (
            id.startsWith('admin')
          ) {

            showAdminSection(id);

          } else {

            showCustomerSection(id);

          }

        };

    }
  );


/* =====================================================
   ADMIN ACCOUNT CREATION
===================================================== */

$('adminCreateForm')
  .addEventListener(
    'submit',
    function (event) {

      event.preventDefault();


      /*
         SECURITY CHECK:

         Customer cannot create admin accounts.
      */

      if (
        !currentUser
        ||
        currentUser.role !== 'admin'
      ) {

        toast(
          'Only an authenticated administrator can create admin accounts.',
          'error'
        );

        return;

      }


      const form =
        event.currentTarget;


      clearErrors(form);


      let valid =
        validateForm(form);


      const name =
        $('adminName')
          .value
          .trim();


      const email =
        $('adminEmail')
          .value
          .trim()
          .toLowerCase();


      const username =
        $('adminUsername')
          .value
          .trim();


      const password =
        $('adminPassword').value;


      const confirmPassword =
        $('adminConfirmPassword').value;


      /* NAME */

      if (
        !nameOK(name)
      ) {

        error(
          $('adminName'),
          'Letters and spaces only.'
        );

        valid = false;

      }


      /* USERNAME */

      if (
        !usernameOK(username)
      ) {

        error(
          $('adminUsername'),
          'Username may contain letters and numbers only.'
        );

        valid = false;

      }


      /* EMAIL */

      if (
        !emailOK(email)
      ) {

        error(
          $('adminEmail'),
          'Enter a valid email.'
        );

        valid = false;

      }


      /* PASSWORD */

      if (
        !passwordOK(password)
      ) {

        error(
          $('adminPassword'),
          'Password must be 8+ characters, letters/numbers only.'
        );

        valid = false;

      }


      /* CONFIRM PASSWORD */

      if (
        password !== confirmPassword
      ) {

        error(
          $('adminConfirmPassword'),
          'Passwords do not match.'
        );

        valid = false;

      }


      /* DUPLICATE EMAIL */

      if (
        admins.some(
          admin =>
            admin.email?.toLowerCase()
            === email
        )
        ||
        customers.some(
          customer =>
            customer.email?.toLowerCase()
            === email
        )
      ) {

        error(
          $('adminEmail'),
          'Email is already registered.'
        );

        valid = false;

      }


      /* DUPLICATE USERNAME */

      if (
        admins.some(
          admin =>
            admin.username?.toLowerCase()
            === username.toLowerCase()
        )
        ||
        customers.some(
          customer =>
            customer.username?.toLowerCase()
            === username.toLowerCase()
        )
      ) {

        error(
          $('adminUsername'),
          'Username is already taken.'
        );

        valid = false;

      }


      if (!valid) {

        toast(
          'Please correct the highlighted fields.',
          'error'
        );

        return;

      }


      admins.push({

        name:
          name,

        email:
          email,

        username:
          username,

        password:
          password

      });


      set(
        KEY.admins,
        admins
      );


      form.reset();


      renderAdmins();


      toast(
        'Admin account created. Customer accounts cannot access this page.'
      );

    }
  );


/* =====================================================
   ADMIN BOOKING
===================================================== */

$('bookingForm')
  .addEventListener(
    'submit',
    function (event) {

      event.preventDefault();


      const form =
        event.currentTarget;


      clearErrors(form);


      if (
        !validateForm(form)
      ) {

        toast(
          'Please correct the booking form.',
          'error'
        );

        return;

      }


      bookings.push({

        id:
          'BK-' +
          String(Date.now())
            .slice(-6),

        name:
          $('customerName')
            .value
            .trim(),

        email:
          $('customerEmail')
            .value
            .trim(),

        phone:
          $('customerPhone')
            .value
            .trim(),

        eventType:
          $('eventType')
            .value,

        date:
          $('eventDate')
            .value,

        guests:
          Number(
            $('guestCount').value
          ),

        menu:
          $('menu').value,

        venue:
          $('venue')
            .value
            .trim(),

        notes:
          $('bookingNotes')
            .value
            .trim(),

        status:
          'Pending'

      });


      set(
        KEY.bookings,
        bookings
      );


      form.reset();


      renderBookings();

      updatePaymentOptions();

      updateAdmin();


      toast(
        'Booking added.'
      );

    }
  );


/* =====================================================
   PAYMENT
===================================================== */

$('paymentForm')
  .addEventListener(
    'submit',
    function (event) {

      event.preventDefault();


      const form =
        event.currentTarget;


      clearErrors(form);


      if (
        !validateForm(form)
      ) {

        toast(
          'Please correct the payment form.',
          'error'
        );

        return;

      }


      payments.push({

        id:
          'PAY-' +
          String(Date.now())
            .slice(-6),

        bookingId:
          $('paymentBooking')
            .value,

        date:
          $('paymentDate')
            .value,

        amount:
          Number(
            $('amount').value
          ),

        method:
          $('paymentMethod')
            .value,

        status:
          $('paymentStatus')
            .value,

        notes:
          $('paymentNotes')
            .value
            .trim()

      });


      set(
        KEY.payments,
        payments
      );


      form.reset();


      renderPayments();

      updateAdmin();


      toast(
        'Payment recorded.'
      );

    }
  );


/* =====================================================
   CUSTOMER BOOKING REQUEST
===================================================== */

$('customerBookingForm')
  .addEventListener(
    'submit',
    function (event) {

      event.preventDefault();


      const form =
        event.currentTarget;


      clearErrors(form);


      if (
        !validateForm(form)
      ) {

        toast(
          'Please correct the booking request.',
          'error'
        );

        return;

      }


      const customer =
        customers.find(
          account =>
            account.email?.toLowerCase()
            ===
            currentUser.email?.toLowerCase()
        );


      bookings.push({

        id:
          'BK-' +
          String(Date.now())
            .slice(-6),

        name:
          $('customerRequestName')
            .value
            .trim(),

        email:
          currentUser.email,

        phone:
          customer?.phone || '',

        eventType:
          $('customerRequestType')
            .value,

        date:
          $('customerRequestDate')
            .value,

        guests:
          Number(
            $('customerRequestGuests')
              .value
          ),

        menu:
          $('customerRequestMenu')
            .value,

        venue:
          $('customerRequestVenue')
            .value
            .trim(),

        notes:
          $('customerRequestNotes')
            .value
            .trim(),

        status:
          'Pending'

      });


      set(
        KEY.bookings,
        bookings
      );


      form.reset();


      prefillCustomer();


      renderBookings();

      updateCustomer();


      toast(
        'Booking request submitted.'
      );

    }
  );


/* =====================================================
   RENDER BOOKINGS
===================================================== */

function renderBookings() {

  const rows =
    bookings
      .map(
        booking => `

          <tr>

            <td>
              ${booking.id}
            </td>

            <td>
              ${escapeHTML(
                booking.name
              )}
            </td>

            <td>
              ${escapeHTML(
                booking.eventType
              )}
            </td>

            <td>
              ${booking.date}
            </td>

            <td>
              ${booking.guests}
            </td>

            <td>

              <span
                class="status ${statusClass(
                  booking.status
                )}">

                ${booking.status}

              </span>

            </td>

          </tr>

        `
      )
      .join('');


  $('bookingsBody').innerHTML =
    rows
    ||
    `
      <tr>
        <td
          colspan="6"
          class="empty">

          No bookings yet.

        </td>
      </tr>
    `;


  $('recentBookingsBody').innerHTML =

    bookings
      .slice(-5)
      .reverse()
      .map(
        booking => `

          <tr>

            <td>
              ${booking.id}
            </td>

            <td>
              ${escapeHTML(
                booking.name
              )}
            </td>

            <td>
              ${escapeHTML(
                booking.eventType
              )}
            </td>

            <td>
              ${booking.date}
            </td>

            <td>
              ${booking.guests}
            </td>

            <td>

              <span
                class="status ${statusClass(
                  booking.status
                )}">

                ${booking.status}

              </span>

            </td>

          </tr>

        `
      )
      .join('')

    ||

    `
      <tr>

        <td
          colspan="6"
          class="empty">

          No bookings yet.

        </td>

      </tr>
    `;


  renderCustomerBookings();

}


/* =====================================================
   RENDER PAYMENTS
===================================================== */

function renderPayments() {

  $('paymentsBody').innerHTML =

    payments
      .map(
        payment => `

          <tr>

            <td>
              ${payment.id}
            </td>

            <td>
              ${payment.bookingId}
            </td>

            <td>
              ${payment.date}
            </td>

            <td>
              ₱${Number(
                payment.amount
              ).toLocaleString()}
            </td>

            <td>
              ${payment.method}
            </td>

            <td>

              <span
                class="status ${statusClass(
                  payment.status
                )}">

                ${payment.status}

              </span>

            </td>

          </tr>

        `
      )
      .join('')

    ||

    `
      <tr>

        <td
          colspan="6"
          class="empty">

          No payments yet.

        </td>

      </tr>
    `;

}


/* =====================================================
   RENDER CUSTOMERS
===================================================== */

function renderCustomers() {

  $('customersBody').innerHTML =

    customers
      .map(
        customer => `

          <tr>

            <td>
              ${escapeHTML(
                customer.name
              )}
            </td>

            <td>
              ${escapeHTML(
                customer.email
              )}
            </td>

            <td>
              ${escapeHTML(
                customer.phone
              )}
            </td>

            <td>
              ${escapeHTML(
                customer.gender
              )}
            </td>

            <td>
              ${customer.birthDate}
            </td>

          </tr>

        `
      )
      .join('')

    ||

    `
      <tr>

        <td
          colspan="5"
          class="empty">

          No customers yet.

        </td>

      </tr>
    `;

}


/* =====================================================
   RENDER ADMINS
===================================================== */

function renderAdmins() {

  $('adminsBody').innerHTML =

    admins
      .map(
        admin => `

          <tr>

            <td>
              ${escapeHTML(
                admin.name
              )}
            </td>

            <td>
              ${escapeHTML(
                admin.username || ''
              )}
            </td>

            <td>
              ${escapeHTML(
                admin.email
              )}
            </td>

          </tr>

        `
      )
      .join('');

}


/* =====================================================
   CUSTOMER BOOKINGS
===================================================== */

function renderCustomerBookings() {

  const mine =
    bookings.filter(
      booking =>
        booking.email?.toLowerCase()
        ===
        currentUser?.email?.toLowerCase()
    );


  $('customerBookingsBody').innerHTML =

    mine
      .map(
        booking => `

          <tr>

            <td>
              ${booking.id}
            </td>

            <td>
              ${booking.eventType}
            </td>

            <td>
              ${booking.date}
            </td>

            <td>
              ${booking.guests}
            </td>

            <td>
              ${escapeHTML(
                booking.venue
              )}
            </td>

            <td>

              <span
                class="status ${statusClass(
                  booking.status
                )}">

                ${booking.status}

              </span>

            </td>

          </tr>

        `
      )
      .join('')

    ||

    `
      <tr>

        <td
          colspan="6"
          class="empty">

          No bookings yet.

        </td>

      </tr>
    `;


  return mine;

}


/* =====================================================
   PAYMENT BOOKING OPTIONS
===================================================== */

function updatePaymentOptions() {

  $('paymentBooking').innerHTML =

    '<option value="">Select booking</option>'

    +

    bookings
      .map(
        booking => `

          <option value="${booking.id}">

            ${booking.id}
            —
            ${escapeHTML(
              booking.name
            )}

          </option>

        `
      )
      .join('');

}


/* =====================================================
   UPDATE ADMIN DASHBOARD
===================================================== */

function updateAdmin() {

  renderBookings();

  renderPayments();

  renderCustomers();

  renderAdmins();

  updatePaymentOptions();


  $('statBookings')
    .textContent =
    bookings.length;


  $('statPayments')
    .textContent =
    '₱' +

    payments
      .reduce(
        (
          total,
          payment
        ) =>
          total +
          Number(
            payment.amount || 0
          ),

        0
      )
      .toLocaleString();


  $('statCustomers')
    .textContent =
    customers.length;


  $('statPending')
    .textContent =
    bookings.filter(
      booking =>
        booking.status ===
        'Pending'
    ).length;


  $('reportRevenue')
    .textContent =
    '₱' +

    payments
      .reduce(
        (
          total,
          payment
        ) =>
          total +
          Number(
            payment.amount || 0
          ),

        0
      )
      .toLocaleString();


  $('reportBookings')
    .textContent =
    bookings.length;


  $('reportPaid')
    .textContent =
    payments.filter(
      payment =>
        payment.status ===
        'Paid'
    ).length;


  $('reportPending')
    .textContent =
    bookings.filter(
      booking =>
        booking.status ===
        'Pending'
    ).length;


  $('reportSummary').innerHTML = `

    <div>
      Confirmed:
      <b>
        ${
          bookings.filter(
            booking =>
              booking.status ===
              'Confirmed'
          ).length
        }
      </b>
    </div>

    <div>
      Pending:
      <b>
        ${
          bookings.filter(
            booking =>
              booking.status ===
              'Pending'
          ).length
        }
      </b>
    </div>

  `;


  $('adminUserName')
    .textContent =
    currentUser?.name
    ||
    'Administrator';


  $('adminUserEmail')
    .textContent =
    currentUser?.email
    ||
    '';

}


/* =====================================================
   UPDATE CUSTOMER
===================================================== */

function updateCustomer() {

  const mine =
    renderCustomerBookings();


  $('customerUserName')
    .textContent =
    currentUser?.name
    ||
    'Customer';


  $('customerUserEmail')
    .textContent =
    currentUser?.email
    ||
    '';


  $('customerStatBookings')
    .textContent =
    mine.length;


  $('customerStatPending')
    .textContent =
    mine.filter(
      booking =>
        booking.status ===
        'Pending'
    ).length;


  $('customerStatConfirmed')
    .textContent =
    mine.filter(
      booking =>
        booking.status ===
        'Confirmed'
    ).length;


  $('profileName')
    .textContent =
    currentUser?.name
    ||
    '-';


  $('profileEmail')
    .textContent =
    currentUser?.email
    ||
    '-';


  $('profilePhone')
    .textContent =
    currentUser?.phone
    ||
    '-';


  $('profileGender')
    .textContent =
    currentUser?.gender
    ||
    '-';


  $('profileBirthDate')
    .textContent =
    currentUser?.birthDate
    ||
    '-';


  prefillCustomer();


  $('customerRecent').innerHTML =

    mine
      .slice(-3)
      .reverse()
      .map(
        booking => `

          <div class="recent-item">

            <b>
              ${escapeHTML(
                booking.eventType
              )}
            </b>

            <span>
              ${booking.date}
              ·
              ${booking.guests}
              guests
              ·
              ${booking.status}
            </span>

          </div>

        `
      )
      .join('')

    ||

    '<p class="muted">No bookings yet.</p>';

}


/* =====================================================
   PREFILL CUSTOMER BOOKING
===================================================== */

function prefillCustomer() {

  if (!currentUser) {
    return;
  }


  $('customerRequestName')
    .value =
    currentUser.name
    ||
    '';


  $('customerRequestEmail')
    .value =
    currentUser.email
    ||
    '';

}


/* =====================================================
   STATUS CLASS
===================================================== */

function statusClass(status) {

  return String(
    status || ''
  )
    .toLowerCase()
    .replace(
      /\s+/g,
      '-'
    );

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value) {

  return String(
    value ?? ''
  )
    .replace(
      /[&<>"']/g,
      character => ({

        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'

      }[character])
    );

}


/* =====================================================
   LOGOUT
===================================================== */

function logout() {

  currentUser = null;


  $('adminPage')
    .classList
    .add('hidden');


  $('customerPage')
    .classList
    .add('hidden');


  $('loginPage')
    .classList
    .remove('hidden');


  $('loginPassword')
    .value = '';


  selectRole(
    'admin'
  );


  toast(
    'Logged out.'
  );

}


/* =====================================================
   BUTTONS
===================================================== */

$('adminLogout')
  .onclick =
  logout;


$('customerLogout')
  .onclick =
  logout;


$('settingsButton')
  .onclick =
  () => {

    toast(
      'CaterRing is running in local browser demo mode.'
    );

  };


$('forgotPassword')
  .onclick =
  () => {

    toast(
      'Password recovery is not connected in this prototype.',
      'error'
    );

  };


$('anotherAccountButton')
  .onclick =
  () => {

    logout();

    $('loginEmail').value = '';

    $('loginPassword').value = '';

  };


/* =====================================================
   REMEMBERED LOGIN
===================================================== */

const saved =
  localStorage.getItem(
    'cateringLoginEmail'
  );


if (saved) {

  $('loginEmail')
    .value =
    saved;

}


/* =====================================================
   DATE LIMITS
===================================================== */

$('eventDate')
  .min =
  today();


$('customerRequestDate')
  .min =
  today();


$('paymentDate')
  .max =
  today();


$('regBirthDate')
  .max =
  today();


/* =====================================================
   INITIALIZE
===================================================== */

selectRole(
  'admin'
);


renderBookings();

renderPayments();

renderCustomers();

renderAdmins();

updatePaymentOptions();

updateAdmin();