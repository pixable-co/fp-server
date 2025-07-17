import React, { useEffect, useState } from 'react';
import { Skeleton } from 'antd';
import usePartnerStore from "../../store.js";
import {fetchData} from "../../services/fetchData.js";

const MyBookingLink = () => {
    const zustandUrl = usePartnerStore((state) => state.partnerProfileUrl); // only used as fallback
    const [finalUrl, setFinalUrl] = useState(null);

    // Utility: Read cookie by name
    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
        return null;
    };

    // Load URL from API if on /my-account/, otherwise use cookie or Zustand
    useEffect(() => {
        const isOnMyAccount = window.location.pathname === '/my-account/';

        if (isOnMyAccount) {
            fetchData('fpserver/get_partner_data', (response) => {
                if (response.success) {
                    const profileUrl = response.data.partnerProfileUrl;

                    // Set cookie for reuse elsewhere
                    document.cookie = `partner_profile_url=${encodeURIComponent(profileUrl)}; path=/`;

                    // Set local final URL
                    setFinalUrl(profileUrl);
                }
            });
        } else {
            const cookieUrl = getCookie('partner_profile_url');
            if (cookieUrl) {
                setFinalUrl(cookieUrl);
            } else if (zustandUrl) {
                document.cookie = `partner_profile_url=${encodeURIComponent(zustandUrl)}; path=/`;
                setFinalUrl(zustandUrl);
            }
        }
    }, [zustandUrl]);

    // Update any existing <a><i class="fas fa-link"></i></a> links in DOM
    useEffect(() => {
        if (!finalUrl) return;

        const icons = document.querySelectorAll('i.fas.fa-link');
        icons.forEach((icon) => {
            const parentLink = icon.closest('a');
            if (parentLink) {
                parentLink.href = finalUrl;
                parentLink.target = '_blank';
                parentLink.rel = 'noopener noreferrer';
            }
        });
    }, [finalUrl]);

    return (
        <div>
            {finalUrl ? (
                <a href={finalUrl} target="_blank" rel="noopener noreferrer">
                    <i className="fas fa-link"></i>
                </a>
            ) : (
                <Skeleton.Button active size="small" shape="circle" />
            )}
        </div>
    );
};

export default MyBookingLink;
