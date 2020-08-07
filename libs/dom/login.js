(function () {
  let input = document.querySelector('#LoginComponent').getElementsByTagName('input');
  input[0].value = 'username';
  input[1].value = 'password';
  setTimeout(() => {
    document.querySelector('#LoginComponent button').click();
  }, 500);
})()