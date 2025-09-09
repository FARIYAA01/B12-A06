
// API Endpoints

const API = {
  ALL_PLANTS: 'https://openapi.programming-hero.com/api/plants',
  ALL_CATEGORIES: 'https://openapi.programming-hero.com/api/categories',
  BY_CATEGORY: (id) => `https://openapi.programming-hero.com/api/category/${id}`,
  DETAILS: (id) => `https://openapi.programming-hero.com/api/plant/${id}`,
};



let activeCategory = 'all';
let allPlantsCache = [];
let cart = [];




// Utilities..

const formatMoney = (amount) => `৳${Number(amount || 0).toLocaleString()}`;
const truncateText = (str, maxLength = 90) => (str && str.length > maxLength ? str.slice(0, maxLength) + '…' : str || '');
const toggleLoader = (element, show = true) => element.classList.toggle('hidden', !show);

function showError(message) {
  console.error(message);
  let banner = document.getElementById('errorBanner');

  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'errorBanner';
    banner.className = 'container mx-auto px-4 py-2';
    document.body.prepend(banner);
  }

  banner.innerHTML = `
    <div class="alert alert-error shadow-lg">
      <div><i class="fa-solid fa-triangle-exclamation"></i>
      <span class="ml-2">${message}</span></div>
    </div>
  `;

  setTimeout(() => banner.remove(), 8000);
}




// Categories

async function loadCategories() {
  const categoryList = document.getElementById('categoryList');

  try {
    const res = await fetch(API.ALL_CATEGORIES);
    if (!res.ok) throw new Error('Failed to fetch categories: ' + res.status);

    const data = await res.json();
    const categories = Array.isArray(data?.categories) ? data.categories : Array.isArray(data?.data) ? data.data : [];

    categoryList.innerHTML = '';

    // "All Trees" button first
    categoryList.appendChild(createCategoryButton({ id: 'all', name: 'All Trees' }, true));

    if (!categories.length) {
      ['Fruit Trees', 'Flowering Trees', 'Medicinal', 'Evergreen'].forEach((name, idx) => {
        categoryList.appendChild(createCategoryButton({ id: idx + 1, name }));
      });
      return;
    }

    categories.forEach((cat, idx) => {
      const id = cat?.id ?? cat?.category_id ?? idx + 1;
      const name = cat?.name ?? cat?.category_name ?? 'Category';
      categoryList.appendChild(createCategoryButton({ id, name }));
    });
  } catch (err) {
    showError(err.message || err);
  }
}

function createCategoryButton(category, isActive = false) {
  const btn = document.createElement('button');
  btn.className = `btn btn-sm justify-start w-full mb-2 rounded-lg ${isActive ? 'active-cat' : ''}`;
  btn.textContent = category.name;
  btn.dataset.id = category.id;

  btn.addEventListener('click', () => {
    document.querySelectorAll('#categoryList .btn').forEach(b => b.classList.remove('active-cat'));
    btn.classList.add('active-cat');
    activeCategory = category.id;
    loadPlants(category.id);
  });

  return btn;
}




// Plants

async function loadPlants(categoryId = 'all') {
  const cardsGrid = document.getElementById('cardsGrid');
  const cardsLoader = document.getElementById('cardsLoader');
  const emptyState = document.getElementById('emptyState');

  toggleLoader(cardsLoader, true);
  emptyState.classList.add('hidden');
  cardsGrid.innerHTML = '';

  try {
    const url = categoryId === 'all' ? API.ALL_PLANTS : API.BY_CATEGORY(categoryId);
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch plants: ' + res.status);

    const data = await res.json();
    const plants = Array.isArray(data?.plants) ? data.plants : Array.isArray(data?.data) ? data.data : [];
    allPlantsCache = plants;

    renderPlantCards(plants);
  } catch (err) {
    showError(err.message || err);
  } finally {
    toggleLoader(cardsLoader, false);
  }
}

function renderPlantCards(plants) {
  const cardsGrid = document.getElementById('cardsGrid');
  const emptyState = document.getElementById('emptyState');

  cardsGrid.innerHTML = '';
  if (!plants.length) return emptyState.classList.remove('hidden');

  plants.forEach((p) => {
    const id = p?.id ?? p?.plantId ?? '';
    const name = p?.name ?? p?.common_name ?? 'Tree';
    const image = p?.image || p?.img || 'https://placehold.co/600x400?text=Tree';
    const shortDesc = p?.short_description || p?.description || '';
    const category = p?.category || p?.type || 'Tree';
    const price = Number(p?.price ?? 0);

    const card = document.createElement('div');
    card.className = 'card bg-base-200/60 shadow-sm rounded-2xl';
    card.innerHTML = `
      <figure class="px-4 pt-4">
        <img src="${image}" class="rounded-xl h-40 w-full object-cover" alt="${name}" onerror="this.src='https://placehold.co/600x400?text=No+Image'"/>
      </figure>
      <div class="card-body">
        <h3 class="font-bold text-lg text-emerald-800 hover:underline cursor-pointer" data-open-details>${name}</h3>
        <p class="text-sm opacity-80">${truncateText(shortDesc)}</p>
        <div class="flex items-center justify-between mt-2 text-sm">
          <span class="badge badge-ghost">${category}</span>
          <span class="font-semibold">${formatMoney(price)}</span>
        </div>
        <div class="card-actions mt-3">
          <button class="btn btn-success btn-sm rounded-xl w-full" data-add-to-cart>Add to Cart</button>
        </div>
      </div>
    `;

    card.querySelector('[data-open-details]').addEventListener('click', () => openDetails(id));
    card.querySelector('[data-add-to-cart]').addEventListener('click', () =>
      addToCart({ id, name, price })
    );

    cardsGrid.appendChild(card);
  });
}




// Details Modal

async function openDetails(id) {
  const detailsModal = document.getElementById('detailsModal');
  const modalContent = document.getElementById('modalContent');
  const pageLoader = document.getElementById('pageLoader');

  toggleLoader(pageLoader, true);

  try {
    const res = await fetch(API.DETAILS(id));
    if (!res.ok) throw new Error('Failed to fetch details: ' + res.status);

    const data = await res.json();
    const plant = data?.plant || data?.data || {};
    const image = plant?.image || plant?.img || 'https://placehold.co/600x400?text=Tree';

    modalContent.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-5 gap-5">
        <img class="md:col-span-2 w-full h-56 object-cover rounded-xl" src="${image}" alt="${plant?.name || 'Tree'}" onerror="this.src='https://placehold.co/600x400?text=No+Image'" />
        <div class="md:col-span-3">
          <h3 class="text-2xl font-extrabold text-emerald-800">${plant?.name || plant?.common_name || 'Tree'}</h3>
          <p class="mt-2 opacity-80">${plant?.description || 'No description available.'}</p>
          <div class="mt-4 flex flex-wrap gap-2 text-sm">
            <span class="badge">${plant?.category || 'Tree'}</span>
            <span class="badge badge-ghost">Height: ${plant?.height || '—'}</span>
            <span class="badge badge-ghost">Climate: ${plant?.climate || '—'}</span>
            <span class="badge badge-ghost">Soil: ${plant?.soil || '—'}</span>
          </div>
          <div class="mt-4 flex items-center justify-between">
            <span class="text-lg font-bold">${formatMoney(Number(plant?.price || 0))}</span>
            <button class="btn btn-success" id="modalAddBtn"><i class="fa-solid fa-cart-plus mr-2"></i>Add to Cart</button>
          </div>
        </div>
      </div>
    `;

    detailsModal.showModal();

    document.getElementById('modalAddBtn')?.addEventListener('click', () => {
      addToCart({
        id: plant?.id || id,
        name: plant?.name || plant?.common_name || 'Tree',
        price: Number(plant?.price || 0),
      });
      detailsModal.close();
    });
  } catch (err) {
    showError(err.message || err);
  } finally {
    toggleLoader(pageLoader, false);
  }
}




// Cart

function addToCart(item) {
  cart.push(item);
  renderCart();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  renderCart();
}

function renderCart() {
  const cartList = document.getElementById('cartList');
  const cartTotal = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');

  cartList.innerHTML = '';
  let total = 0;

  cart.forEach((item, idx) => {
    total += Number(item.price || 0);

    const li = document.createElement('li');
    li.className = 'flex items-center justify-between bg-base-100 rounded-xl p-3';
    li.innerHTML = `
      <div>
        <p class="font-medium">${item.name}</p>
        <p class="text-xs opacity-70">${formatMoney(item.price)}</p>
      </div>
      <button class="btn btn-ghost btn-xs" title="Remove"><i class="fa-solid fa-xmark"></i></button>
    `;

    li.querySelector('button').addEventListener('click', () => removeFromCart(idx));
    cartList.appendChild(li);
  });

  cartTotal.textContent = formatMoney(total);
  checkoutBtn.disabled = cart.length === 0;
}




// Searching

function applySearch() {
  const searchInput = document.getElementById('searchInput');
  const query = searchInput.value.trim().toLowerCase();

  if (!query) return renderPlantCards(allPlantsCache);

  const filtered = allPlantsCache.filter(p => (p?.name || p?.common_name || '').toLowerCase().includes(query));
  renderPlantCards(filtered);
}

document.getElementById('searchBtn').addEventListener('click', applySearch);
document.getElementById('searchInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    applySearch();
  }
});
document.getElementById('clearCartBtn').addEventListener('click', () => {
  cart = [];
  renderCart();
});




// Initialization

(async function init() {
  try {
    await loadCategories();
    await loadPlants('all');
  } catch (err) {
    showError(err.message || err);
  }
})();
