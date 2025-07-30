import React, { useEffect, useState } from 'react';
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    Progress,
    Skeleton,
    Collapse,
} from 'antd';
import { fetchData } from '../../services/fetchData';
import swal from 'sweetalert';
import FhProUpgrade from '../../common/controls/FhProUpgrade';

const { Panel } = Collapse;

const PartnerBroadcastMessage = ({ currentUserPartnerPostId }) => {
    const [clients, setClients] = useState([]);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [isSending, setIsSending] = useState(false);
    const [progress, setProgress] = useState(0);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [loadingClients, setLoadingClients] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    // Watch screen width
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch clients on mount
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

    // Upgrade modal based on subscription
    useEffect(() => {
        if (
            typeof fpserver_settings !== 'undefined' &&
            fpserver_settings.has_active_subscription === ''
        ) {
            setShowUpgradeModal(true);
        }
    }, []);

    // Table columns for desktop
    const columns = [
        {
            title: 'Name',
            dataIndex: 'customer_name',
            key: 'customer_name',
            render: (text, record) => (
                <div>
                    <a href={`/view-client/?id=${record.customer_id}`}>
                        {text}
                    </a>
                    <a href={`/messages?customer_id=${record.customer_id}`} style={{ marginLeft: 8 }}>
                        <span><i className="fas fa-comments-alt" /></span>
                    </a>
                </div>
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
            key: 'total_spend',
            render: (value) => (
                <span>£{value}</span>
            )
        },
        {
            title: 'Last Booking Date',
            dataIndex: 'last_booking_date',
            key: 'last_booking_date'
        },
    ];

    // Handle opening modal
    const handleBroadcastClick = () => {
        if (selectedRowKeys.length === 0) {
            swal('Warning', 'Please select at least one client.', 'warning');
            return;
        }
        setIsModalOpen(true);
    };

    // Handle send
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

    // Accordion (mobile)
    const renderMobileAccordion = () => (
        <Collapse accordion>
            {clients.map(client => (
                <Panel
                    key={client.client_id}
                    header={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{client.customer_name}</span>
                            <i className="fas fa-comments-alt" />
                        </div>
                    }
                >
                    <p><strong>Total Completed Bookings:</strong> {client.total_completed_bookings}</p>
                    <p><strong>Total Spend:</strong> £{client.total_spend}</p>
                    <p><strong>Last Booking Date:</strong> {client.last_booking_date}</p>

                    <Button
                        size="small"
                        type={selectedRowKeys.includes(client.client_id) ? 'primary' : 'default'}
                        onClick={() => {
                            const alreadySelected = selectedRowKeys.includes(client.client_id);
                            setSelectedRowKeys(alreadySelected
                                ? selectedRowKeys.filter(k => k !== client.client_id)
                                : [...selectedRowKeys, client.client_id]);
                        }}
                        style={{ marginTop: 8 }}
                    >
                        {selectedRowKeys.includes(client.client_id) ? 'Selected' : 'Select'}
                    </Button>
                </Panel>
            ))}
        </Collapse>
    );

    return (
        <div>
            {loadingClients ? (
                <Skeleton active paragraph={{ rows: 8 }} />
            ) : (
                <>
                    {isMobile ? (
                        renderMobileAccordion()
                    ) : (
                        <Table
                            rowKey="client_id"
                            dataSource={clients}
                            columns={columns}
                            rowSelection={{
                                selectedRowKeys,
                                onChange: setSelectedRowKeys
                            }}
                            pagination={false}
                            bordered
                        />
                    )}
                </>
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