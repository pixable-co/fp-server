import { useState, useEffect } from "react";
import { Form, message, Spin } from "antd";
import FhInput from "../../common/controls/FhInput.jsx";
import FhButton from "../../common/controls/FhButton.jsx";
import FhMedia from "../../common/controls/FhMedia.jsx";
import FhSelect from "../../common/controls/FhSelect.jsx";
import FhIconButton from "../../common/controls/FhIconButton.jsx";
import FhRepeater from "../../common/controls/FhRepeter.jsx";
import FhModal from "../../common/controls/FhModal.jsx";
import useMediaStore from "../../common/controls/mediaStore.js";

export default function ServiceForm() {
    const [form] = Form.useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { uploadedUrls, serviceTypes, clearUrls } = useMediaStore();

    const partner_id = Number(fpserver_settings.partner_post_id);
    // useEffect(() => {
    //     console.log("Uploaded URLs:", uploadedUrls);
    //     // Cleanup function
    //     return () => {
    //         clearUrls();
    //     };
    // }, [uploadedUrls]);

    const category = [
        { value: "hair", label: "Hair" },
        { value: "nail", label: "Nail" },
        { value: "facial", label: "Facial" },
        { value: "massage", label: "Massage" },
        { value: "tanning", label: "Tanning" },
        { value: "waxing", label: "Waxing" },
        { value: "makeup", label: "Makeup" },
        { value: "other", label: "Other" },
    ];

    const size = [
        { value: "small", label: "Small" },
        { value: "medium", label: "Medium" },
        { value: "large", label: "Large" },
    ];

    const length = [
        { value: "small", label: "Small" },
        { value: "medium", label: "Medium" },
        { value: "large", label: "Large" },
    ];

    const postData = async (values) => {
        console.log("Form values:", values);

        // Format availability data according to ACF repeater field structure
        const formattedAvailability = (values.availability || []).map(item => ({
            field_6777c8d82f7ef: item.day,
            field_6777c91e2f7f0: item.startTime,
            field_6777c9232f7f1: item.endTime,
            field_6777c9262f7f2: item.extraCharge || 0
        }));

        const payload = {
            serviceID: 213,
            serviceName: values.serviceName,
            serviceSize: values.sizes,
            serviceLength: values.length,
            serviceCategorie: values.categories,
            serviceTag: values.tags,
            serviceTypes: values.serviceTypes || [],
            servicePrice: values.servicePrice,
            availability: formattedAvailability,
            notice_needed: values.noticeTime,
            booking_far_in_advance: values.futureBookingTime,
            clients_per_slot: values.clientsPerSlot,
            private_service: values.overrideAvailability,
            partner_id: partner_id,
            serviceImages: uploadedUrls
        };

        console.log("Submitting payload:", payload);

        try {
            setIsSubmitting(true);
            const response = await fetch(
                `${fpserver_settings.base_api_url}/wp-json/custom/v1/create-draft-service-product`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Basic ${btoa("Abir@pixable.co:UYoJ OSTu PlCq jByV vpjw VZyw")}`,
                    },
                    body: JSON.stringify(payload),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || `Error: ${response.statusText}`);
            }

            message.success("Service created successfully!");
            console.log("API Response:", result);
            form.resetFields();
            clearUrls(); // Clear uploaded media after successful submission
        } catch (error) {
            message.error(`Failed to create service: ${error.message}`);
            console.error("Error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = (values) => {
        if (!values.serviceTypes || values.serviceTypes.length === 0) {
            message.error('Please select at least one service type');
            return;
        }

        if (!uploadedUrls.length) {
            message.error('Please upload at least one service image');
            return;
        }

        console.log('Form submitted with values:', values);
        postData(values);
    };

    return (
        <Spin spinning={isSubmitting} tip="Submitting...">
            <div>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    onFinishFailed={(error) => {
                        console.error("Form Validation Failed:", error);
                        message.error("Please fill in all required fields correctly.");
                    }}
                >
                    <div className="w-4/6">
                        <FhInput
                            label="Service Name"
                            name="serviceName"
                            rules={[{ required: true, message: 'Please enter service name' }]}
                        />
                    </div>

                    <div className="flex justify-start gap-4">
                        <FhSelect
                            label="Sizes"
                            name="sizes"
                            placeholder="Select all that apply"
                            options={size}
                            rules={[{ required: true, message: 'Please select size' }]}
                        />
                        <FhSelect
                            label="Length"
                            name="length"
                            placeholder="Select all that apply"
                            options={length}
                            rules={[{ required: true, message: 'Please select length' }]}
                        />
                    </div>

                    <div className="mt-4 mb-8 w-2/6">
                        <FhSelect
                            label="Categories"
                            name="categories"
                            placeholder="Select all that apply"
                            options={category}
                            rules={[{ required: true, message: 'Please select category' }]}
                        />
                    </div>

                    <div className="mt-4 mb-12 w-2/6">
                        <FhSelect
                            label="Tags"
                            name="tags"
                            placeholder="Select all that apply"
                            options={category}
                            rules={[{ required: true, message: 'Please select tags' }]}
                        />
                    </div>

                    <div className="mt-8 mb-8">
                        <Form.Item
                            label="Service Type(s)"
                            name="serviceTypes"
                            rules={[{ required: true, message: 'Please select at least one service type' }]}
                        >
                            <FhIconButton
                                name="serviceTypes"
                                form={form}
                                options={[
                                    { type: "home", title: "Home-based", description: "Clients come to your home" },
                                    { type: "salon", title: "Salon-Based", description: "Clients come to your salon" },
                                    { type: "mobile", title: "Mobile", description: "You travel to your clients" },
                                ]}
                            />
                        </Form.Item>
                    </div>

                    <div className="mt-4 mb-8 w-2/6">
                        <FhSelect
                            label="Do you want to override your general availability for this service?"
                            name="overrideAvailability"
                            placeholder="Yes"
                            options={[
                                { value: "yes", label: "Yes" },
                                { value: "no", label: "No" },
                            ]}
                            rules={[{ required: true, message: 'Please select an option' }]}
                        />
                    </div>

                    <div className="pt-4 w-4/6">
                        <label>Availability</label>
                        <FhRepeater
                            form={form}
                            fieldName="availability"
                            defaultValues={[{ day: "", startTime: "", endTime: "" }]}
                            fieldNames={["startTime", "endTime"]}
                            controlSupport={{
                                name: "day",
                                type: "select",
                                options: [
                                    { value: "monday", label: "Monday" },
                                    { value: "tuesday", label: "Tuesday" },
                                    { value: "wednesday", label: "Wednesday" },
                                ],
                                placeholder: "Select a day",
                            }}
                        />
                    </div>

                    <div className="w-2/6">
                        <FhInput
                            name="clientsPerSlot"
                            type="number"
                            label="How many clients can you serve per time slot?"
                            rules={[{ required: true, message: 'Please enter number of clients' }]}
                        />
                    </div>

                    <div className="w-2/6">
                        <FhInput
                            name="servicePrice"
                            type="number"
                            label="Service Price"
                            rules={[{ required: true, message: 'Please enter service price' }]}
                        />
                    </div>

                    <div className="w-4/6">
                        <FhMedia name="media" />
                    </div>

                    <div className="mt-8 w-1/6">
                        <button type="submit"
                        className="fhbutton fhbutton--primary"
                        >
                        {isSubmitting ? 'Submitting...' : 'Publish Now'}
                    </button>
                    </div>
                </Form>
            </div>
        </Spin>
    );
}
