<template>
  <div class="add-product-screen">
    <div class="add-product-box">
      <h2>{{ isEditMode ? 'Muokkaa tuotetta' : 'Lisää uusi tuote' }}</h2>

      <p v-if="loadingProduct" class="loading-text">Ladataan tuotetta…</p>

      <template v-else>
        <p v-if="addProductError" class="auth-error">{{ addProductError }}</p>
        <p v-if="addProductSuccess" class="payment-success">
          {{ isEditMode ? '✅ Muutokset tallennettu!' : '✅ Tuote lisätty!' }}
        </p>

        <input v-model="newProduct.name" type="text" placeholder="Tuotteen nimi" />
        <input v-model="newProduct.price" type="number" placeholder="Hinta (€)" />
        <input v-model="newProduct.stock" type="number" placeholder="Varaston määrä (kpl)" />
        <input v-model="newProduct.image" type="text" placeholder="Kuvan linkki (URL)" />
        <textarea
          v-model="newProduct.description"
          placeholder="Tuotteen kuvaus (valinnainen)"
          rows="3"
        ></textarea>

        <select v-model="newProduct.category">
          <option value="old">Vanhat tennarit</option>
          <option value="new">Uudet tennarit</option>
        </select>

        <div class="color-editor">
          <p class="color-editor-label">Värivaihtoehdot (valinnainen)</p>
          <div v-for="(color, index) in newProduct.colors" :key="index" class="color-editor-row">
            <input v-model="color.name" type="text" placeholder="Värin nimi (esim. Musta)" />
            <input v-model="color.image" type="text" placeholder="Kuvan linkki" />
            <button
              type="button"
              class="color-remove"
              title="Poista väri"
              @click="removeColorOption(index)"
            >
              ✕
            </button>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" @click="addColorOption">
            + Lisää väri
          </button>
        </div>

        <div class="add-product-buttons">
          <button class="btn btn-back" @click="cancel">Peruuta</button>
          <button class="btn btn-black" @click="submitNewProduct">
            {{ isEditMode ? 'Tallenna muutokset' : 'Tallenna tuote' }}
          </button>
        </div>

        <button v-if="isEditMode" class="btn btn-clear btn-block" @click="removeProduct">
          Poista tuote
        </button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { submitProduct, updateProduct, deleteProduct, fetchProductById } from '../store.js'

const route = useRoute()
const router = useRouter()

const isEditMode = computed(() => !!route.params.id)

// Ehdotetaan oletuksena samaa kategoriaa, jota käyttäjä katsoi ennen tänne tuloa
const initialCategory = route.query.category === 'new' ? 'new' : 'old'

const newProduct = ref({
  name: '',
  price: '',
  stock: '',
  image: '',
  category: initialCategory,
  description: '',
  colors: [],
})
const loadingProduct = ref(false)
const addProductError = ref('')
const addProductSuccess = ref(false)

// Muokkaustilassa haetaan tuotteen nykyiset tiedot lomakkeelle
onMounted(async () => {
  if (!isEditMode.value) return

  loadingProduct.value = true
  const result = await fetchProductById(route.params.id)
  loadingProduct.value = false

  if (!result.ok) {
    addProductError.value = result.error
    return
  }

  const product = result.product
  newProduct.value = {
    name: product.name,
    price: product.price,
    stock: product.stock,
    image: product.image,
    category: product.category,
    description: product.description || '',
    colors: (product.colors || []).map((color) => ({ ...color })),
  }
})

function addColorOption() {
  newProduct.value.colors.push({ name: '', image: '' })
}

function removeColorOption(index) {
  newProduct.value.colors.splice(index, 1)
}

function cancel() {
  router.push(`/shop/${newProduct.value.category || initialCategory}`)
}

async function submitNewProduct() {
  addProductError.value = ''
  addProductSuccess.value = false

  // Jätetään pois tyhjiksi jääneet väririvit
  const payload = {
    ...newProduct.value,
    colors: newProduct.value.colors.filter((color) => color.name || color.image),
  }

  const result = isEditMode.value
    ? await updateProduct(route.params.id, payload)
    : await submitProduct(payload)

  if (!result.ok) {
    addProductError.value = result.error
    return
  }

  addProductSuccess.value = true
  router.push(`/shop/${result.product.category}`)
}

async function removeProduct() {
  const confirmed = window.confirm(`Poistetaanko tuote "${newProduct.value.name}" pysyvästi?`)
  if (!confirmed) return

  const result = await deleteProduct(route.params.id, newProduct.value.category)

  if (!result.ok) {
    addProductError.value = result.error
    return
  }

  router.push(`/shop/${newProduct.value.category}`)
}
</script>
