import React, { useEffect, useState } from 'react';
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    Progress,
    Skeleton
} from 'antd';
import { fetchData } from '../../services/fetchData';
import swal from 'sweetalert';
import FhProUpgrade from '../../common/controls/FhProUpgrade';

const PartnerBroadcastMessage = ({ currentUserPartnerPostId }) => {
    const [clients, setClients] = useState([]);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [isSending, setIsSending] = useState(false);
    const [progress, setProgress] = useState(0);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [loadingClients, setLoadingClients] = useState(true);

    useEffect(() => {
        fetchData('fpserver/partner_conversations', (response) => {
            if (response.success && Array.isArray(response.data)) {
                const transformed = response.data.map(item => ({
                    ...item,
                    client_id: item.customer_id,
                    post_id: item.client_id || item.customer_id
                }));
                setClients(transformed);
            } else {
                swal('Error', 'Failed to fetch clients.', 'error');
            }
            setLoadingClients(false);
        });
    }, []);

    useEffect(() => {
        if (
            typeof fpserver_settings !== 'undefined' &&
            fpserver_settings.has_active_subscription === ''
        ) {
            setShowUpgradeModal(true);
        }
    }, []);

    const columns = [
        // Conversation ID column removed
        {
            title: 'Name',
            dataIndex: 'customer_name',
            key: 'customer_name',
            render: (text, record) => (
                <a href={`/view-client/?id=${record.customer_id}`}>
                    <span>{text} <i class="fas fa-envelope"></i></span>
                </a>
            )
        },
        {
            title: 'Total Completed Bookings',
            dataIndex: 'total_completed_bookings',
            key: 'total_completed_bookings'
        },
        {
            title: 'Total Spend',
            dataIndex: 'total_spend',
            key: 'total_spend'
        },
        {
            title: 'Last Booking Date',
            dataIndex: 'last_booking_date',
            key: 'last_booking_date'
        },
    ];

    const rowSelection = {
        selectedRowKeys,
        onChange: setSelectedRowKeys
    };

    const handleBroadcastClick = () => {
        if (selectedRowKeys.length === 0) {
            swal('Warning', 'Please select at least one client.', 'warning');
            return;
        }
        setIsModalOpen(true);
    };

    const handleSend = () => {
        form.validateFields().then(values => {
            const { message } = values;
            const selectedClients = clients.filter(client =>
                selectedRowKeys.includes(client.client_id)
            );

            setIsSending(true);
            setProgress(0);
            let sentCount = 0;

            const sendNext = () => {
                const client = selectedClients[sentCount];
                if (!client) {
                    setIsSending(false);
                    swal('Success', 'Broadcast completed!', 'success');
                    setIsModalOpen(false);
                    setSelectedRowKeys([]);
                    form.resetFields();
                    return;
                }

                const payload = {
                    post_id: client.conversation_id,
                    conversation_id: client.conversation_id,
                    partner_id: currentUserPartnerPostId,
                    comment: message,
                    image_url: ''
                };

                fetchData('fpserver/send_partner_message', (response) => {
                    if (!response.success) {
                        swal('Error', `Failed to send to ${client.customer_name}`, 'error');
                    }
                    sentCount++;
                    setProgress(Math.round((sentCount / selectedClients.length) * 100));
                    setTimeout(sendNext, 400);
                }, payload);
            };

            sendNext();
        }).catch(() => {
            swal('Warning', 'Please enter your message.', 'warning');
        });
    };

    return (
        <div>
            {loadingClients ? (
                <Skeleton active paragraph={{ rows: 8 }} />
            ) : (
                <Table
                    rowKey="client_id"
                    dataSource={clients}
                    columns={columns}
                    rowSelection={rowSelection}
                    pagination={false}
                    bordered
                />
            )}

            <Button
                type="primary"
                danger
                style={{ marginTop: 20 }}
                onClick={handleBroadcastClick}
            >
                Broadcast Message
            </Button>

            <Modal
                title="Broadcast Message"
                open={isModalOpen}
                onOk={handleSend}
                onCancel={() => {
                    form.resetFields();
                    setIsModalOpen(false);
                }}
                okText="Send"
                cancelText="Cancel"
                confirmLoading={isSending}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="message"
                        rules={[{ required: true, message: 'Please enter your message.' }]}
                    >
                        <Input.TextArea rows={5} placeholder="Enter your message here..." />
                    </Form.Item>
                </Form>

                {isSending && (
                    <Progress percent={progress} size="small" style={{ marginTop: 10 }} />
                )}
            </Modal>

            {/* <FhProUpgrade
                visible={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                onUpgrade={() => console.log('Redirect to upgrade page')}
            /> */}
        </div>
    );
};

export default PartnerBroadcastMessage;
