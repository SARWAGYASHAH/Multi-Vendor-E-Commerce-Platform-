import { createSlice } from '@reduxjs/toolkit';

const storedCart = localStorage.getItem('cartItems');
const storedAddress = localStorage.getItem('shippingAddress');

const initialState = {
  cartItems: storedCart ? JSON.parse(storedCart) : [],
  shippingAddress: storedAddress
    ? JSON.parse(storedAddress)
    : { address: '', city: '', postalCode: '', country: '' },
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const item = action.payload;
      const existItem = state.cartItems.find((x) => x.product === item.product);

      if (existItem) {
        state.cartItems = state.cartItems.map((x) =>
          x.product === existItem.product ? item : x
        );
      } else {
        state.cartItems.push(item);
      }

      localStorage.setItem('cartItems', JSON.stringify(state.cartItems));
    },
    removeFromCart: (state, action) => {
      state.cartItems = state.cartItems.filter((x) => x.product !== action.payload);
      localStorage.setItem('cartItems', JSON.stringify(state.cartItems));
    },
    saveShippingAddress: (state, action) => {
      state.shippingAddress = action.payload;
      localStorage.setItem('shippingAddress', JSON.stringify(state.shippingAddress));
    },
    clearCart: (state) => {
      state.cartItems = [];
      localStorage.removeItem('cartItems');
    },
  },
});

export const { addToCart, removeFromCart, saveShippingAddress, clearCart } =
  cartSlice.actions;

export default cartSlice.reducer;
