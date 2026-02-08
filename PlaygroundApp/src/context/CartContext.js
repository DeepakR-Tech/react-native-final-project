import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [items, setItems] = useState([]);

    const addToCart = (equipment) => {
        setItems((prevItems) => {
            const existingItem = prevItems.find((item) => item._id === equipment._id);

            if (existingItem) {
                return prevItems.map((item) =>
                    item._id === equipment._id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }

            return [...prevItems, { ...equipment, quantity: 1 }];
        });
    };

    const removeFromCart = (equipmentId) => {
        setItems((prevItems) => prevItems.filter((item) => item._id !== equipmentId));
    };

    const updateQuantity = (equipmentId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(equipmentId);
            return;
        }

        setItems((prevItems) =>
            prevItems.map((item) =>
                item._id === equipmentId ? { ...item, quantity } : item
            )
        );
    };

    const clearCart = () => {
        setItems([]);
    };

    const getTotal = () => {
        return items.reduce((total, item) => total + item.price * item.quantity, 0);
    };

    const getTotalItems = () => {
        return items.reduce((total, item) => total + item.quantity, 0);
    };

    const value = {
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotal,
        getTotalItems,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
