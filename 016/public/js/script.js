let myButton = document.querySelector('button');
let showSite = document.querySelector('.hidden');
myButton.addEventListener('click', () => {
  showSite.classList.toggle('show');
});
