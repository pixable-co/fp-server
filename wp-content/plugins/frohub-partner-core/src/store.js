import { create } from 'zustand';

const usePartnerStore = create((set) => ({
    partnerProfileUrl: null,
    setPartnerProfileUrl: (url) => set({ partnerProfileUrl: url }),
}));

export default usePartnerStore;