// імпорт бібліотек і стилів
import Notiflix from 'notiflix';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

import { fetchImages } from './fetchImages';

// dom посилання, отримання доступу
const searchForm = document.getElementById('search-form');
const gallery = document.querySelector('.gallery');
const loadMoreBtn = document.querySelector('.load-more');

let query = '';
let page = 1;
let simpleLightBox;
const perPage = 40;

loadMoreBtn.style.display = 'none';

const showBtnLoadMore = () => {
  loadMoreBtn.classList.remove('is-hidden');
};

searchForm.addEventListener('submit', onSearchForm);

// поле пошуку
function renderGallery(images) {
  // Перевірка чи існує галерея перед вставкою даних
  if (!gallery) {
    return;
  }
  //створення інформаційнoї розмітки
  const markup = images
    .map(image => {
      const {
        id,
        largeImageURL,
        webformatURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      } = image;
      return `
        <a class="gallery__link" href="${largeImageURL}">
          <div class="gallery-item" id="${id}">
            <img class="gallery-item__img" src="${webformatURL}" alt="${tags}" loading="lazy" />
            <div class="info">
              <p class="info-item"><b>Likes</b>${likes}</p>
              <p class="info-item"><b>Views</b>${views}</p>
              <p class="info-item"><b>Comments</b>${comments}</p>
              <p class="info-item"><b>Downloads</b>${downloads}</p>
            </div>
          </div>
        </a>
      `;
    })
    .join('');

  gallery.insertAdjacentHTML('beforeend', markup);
  //  прокручування сторінки на висоту 2 карток галереї
  const { height: cardHeight } = document
    .querySelector('.gallery')
    .firstElementChild.getBoundingClientRect();
  // показуємо кнопку Load More при новому запиті
  showBtnLoadMore();
  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
}

//запит
function onSearchForm(event) {
  event.preventDefault();
  page = 1;
  query = event.currentTarget.elements.searchQuery.value.trim(); // отримуємо строку запита
  gallery.innerHTML = ''; // очищаємо сторінку при кожному новому запиті

  if (query === '') {
    Notiflix.Notify.failure(
      'The search string cannot be empty. Please specify your search query.'
    );
    return;
  }

  //оброблення промісу
  fetchImages(query, page, perPage)
    .then(data => {
      if (data.totalHits === 0) {
        loadMoreBtn.style.display = 'none';
        Notiflix.Notify.failure(
          'Sorry, there are no images matching your search query. Please try again.'
        );
      } else {
        renderGallery(data.hits);

        simpleLightBox = new SimpleLightbox('.gallery a').refresh();

        Notiflix.Notify.success(`Hooray! We found ${data.totalHits} images.`);
      }
    })
    .catch(error => console.log(error))
    .finally(() => {
      searchForm.reset();
    });
}

function onloadMore() {
  page += 1;
  simpleLightBox.destroy();

  fetchImages(query, page, perPage)
    .then(data => {
      renderGallery(data.hits);
      simpleLightBox = new SimpleLightbox('.gallery a').refresh();

      const totalPages = Math.ceil(data.totalHits / perPage);

      if (page > totalPages) {
        Notiflix.Notify.info(
          "We're sorry, but you've reached the end of search results."
        );
      }
    })
    .catch(error => console.log(error));
}

// Функція, яка виконуеться, якщо користувач дійшов до кінця сторінки
function showLoadMorePage() {
  loadMoreBtn.style.display = 'block';
  if (checkIfEndOfPage()) {
    onloadMore();
  }
}

// Додавання події на прокручування сторінки, яка викликає функцію showLoadMorePage
window.addEventListener('scroll', showLoadMorePage);

loadMoreBtn.addEventListener('click', onloadMore);