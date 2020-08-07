(function () {
  let tmp = [];
  document.querySelector('figure > div[role="presentation"]').getElementsByTagName('a').forEach(e => {
    tmp.push(e.href);
  });
  return tmp;
})()