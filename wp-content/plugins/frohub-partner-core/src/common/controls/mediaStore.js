import { create } from 'zustand'

const useMediaStore = create((set) => ({
    // Existing state
    uploadedUrls: [],
    featuredUrl: null,
    serviceTypes: [], // New state for service types

    // Existing actions
    addUrl: (url) => set((state) => ({
        uploadedUrls: [...state.uploadedUrls, url]
    })),
    removeUrl: (url) => set((state) => ({
        uploadedUrls: state.uploadedUrls.filter((item) => item !== url),
        featuredUrl: state.featuredUrl === url ? null : state.featuredUrl
    })),
    setFeaturedUrl: (url) => set({ featuredUrl: url }),

    // New action for service types
    setServiceTypes: (types) => set({ serviceTypes: types }),

    // Updated clear/reset action
    clearUrls: () => set({
        uploadedUrls: [],
        featuredUrl: null,
        serviceTypes: []
    })
}))

export default useMediaStore
