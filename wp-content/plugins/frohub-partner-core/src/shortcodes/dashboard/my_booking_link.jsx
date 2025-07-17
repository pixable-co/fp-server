import React, { useEffect, useState } from 'react';
import { Skeleton } from 'antd';
import usePartnerStore from "../../store.js";
import {fetchData} from "../../services/fetchData.js";

const MyBookingLink = () => {
    const zustandUrl = usePartnerStore((state) => state.partnerProfileUrl);
    const [finalUrl, setFinalUrl] = useState(null);

    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
        return null;
    };

    const validateUrl = (url) => {
        if (!url) return null;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return `https://${url}`;
        }
        return url;
    };

    const handleLinkClick = (e) => {
        e.preventDefault();
        if (finalUrl) {
            window.open(finalUrl, '_blank', 'noopener,noreferrer');
        }
    };

    useEffect(() => {
        const isOnMyAccount = window.location.pathname === '/my-account/';

        if (isOnMyAccount) {
            fetchData('fpserver/get_partner_data', (response) => {
                if (response.success) {
                    const profileUrl = validateUrl(response.data.partnerProfileUrl);
                    document.cookie = `partner_profile_url=${encodeURIComponent(profileUrl)}; path=/`;
                    setFinalUrl(profileUrl);
                }
            });
        } else {
            const cookieUrl = getCookie('partner_profile_url');
            if (cookieUrl) {
                setFinalUrl(validateUrl(cookieUrl));
            } else if (zustandUrl) {
                const validatedUrl = validateUrl(zustandUrl);
                document.cookie = `partner_profile_url=${encodeURIComponent(validatedUrl)}; path=/`;
                setFinalUrl(validatedUrl);
            }
        }
    }, [zustandUrl]);

    useEffect(() => {
        if (!finalUrl) return;

        const icons = document.querySelectorAll('i.fas.fa-link');
        icons.forEach((icon) => {
            const parentLink = icon.closest('a');
            if (parentLink) {
                parentLink.href = finalUrl;
                parentLink.target = '_blank';
                parentLink.rel = 'noopener noreferrer';
                parentLink.onclick = (e) => {
                    e.preventDefault();
                    window.open(finalUrl, '_blank', 'noopener,noreferrer');
                };
            }
        });
    }, [finalUrl]);

    return (
        <div>
            {finalUrl ? (
                <a
                    href={finalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleLinkClick}
                >
                    <i className="fas fa-link"></i>
                </a>
            ) : (
                <Skeleton.Button active size="small" shape="circle" />
            )}
        </div>
    );
};

export default MyBookingLink;