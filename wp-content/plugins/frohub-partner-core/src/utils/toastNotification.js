import swal from 'sweetalert';

export const toastNotification = (type, title, text) => {
    const icon = ['success', 'error', 'warning', 'info'].includes(type) ? type : 'info';

    swal({
        title,
        text,
        icon,
        buttons: false,
        timer: 3000,
    });
};