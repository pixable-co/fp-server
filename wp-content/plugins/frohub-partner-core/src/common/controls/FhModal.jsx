import { Modal } from 'antd';
import './style.css';

function FhModal({ actionType, formSupport, name, type, id, isOpen, isClose, width, children }) {
    return (
        <Modal
            className='fh-modal'
            title={
                actionType === 'create'
                    ? `Add New ${name}`
                    : actionType === 'edit'
                        ? `Edit ${name}`
                        : actionType === 'delete'
                            ? `Delete ${name}`
                            : ''
            }
            open={isOpen}
            onCancel={isClose}
            footer={null}
            closable={true}
            centered={true}
            width={width}
        >
            {children}
        </Modal>
    );
}

export default FhModal;