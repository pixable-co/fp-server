import { Form } from 'antd';
import FhInput from "../../common/controls/FhInput.jsx";
import FhButton from "../../common/controls/FhButton.jsx";
import FhMedia from "../../common/controls/FhMedia.jsx";
import FhSelect from "../../common/controls/FhSelect.jsx";
import FhIconButton from "../../common/controls/FhIconButton.jsx";
import FhRepeater from "../../common/controls/FhRepeter.jsx";

export default function ServiceForm() {
    const [form] = Form.useForm();

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
        { value: "large", label: "large" },
    ];

    const length = [
        { value: "small", label: "Small" },
        { value: "medium", label: "Medium" },
        { value: "large", label: "large" },
    ];

    const override = [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
    ];

    const interval = [
        { value: "days", label: "Days" },
        { value: "months", label: "Months" },
    ];

    const controlSupport = {
        name: 'day',
        type: 'select', // or you can change this to another type if needed
        options: [
            { value: 'monday', label: 'Monday' },
            { value: 'tuesday', label: 'Tuesday' },
            { value: 'wednesday', label: 'Wednesday' },
            // Add more options as necessary
        ],
        placeholder: 'Select a day'
    };

    return (
        <div>
            <div className="w-4/6">
                <FhInput label="Service Name"/>
            </div>
            <div className="flex justify-start gap-4">
                <FhSelect
                    label="Sizes"
                    placeholder={"Select all that apply"}
                    options={size}
                />
                <FhSelect
                    label="Length"
                    placeholder={"Select all that apply"}
                    options={length}
                />
            </div>

            <div className="mt-4 mb-8 w-2/6">
                <FhSelect
                    label={"Categories"}
                    placeholder={"Select all that apply"}
                    options={category}
                />
            </div>

            <div className="mt-4 mb-12 w-2/6">
                <FhSelect
                    label={"Tags"}
                    placeholder={"Select all that apply"}
                    options={category}
                />
            </div>

            <div className="mt-8 mb-8">
                <label className="">Service Type(s)</label>
                <FhIconButton
                    options={[
                        {
                            type: "home",
                            title: "Home-based",
                            description: "Clients come to your home",
                        },
                        {
                            type: "salon",
                            title: "Salon-Based",
                            description: "Clients come to your salon",
                        },
                        {
                            type: "mobile",
                            title: "Mobile",
                            description: "You travel to your clients",
                        },
                    ]}
                />
            </div>

            <div className="mt-4 mb-8 w-2/6">
                <FhSelect
                    label="Do you want to override your general availability for this service?"
                    placeholder={"Yes"}
                    options={override}
                />
            </div>

            <div className="pt-4 w-4/6">
                <label className="">Availability</label>
                <FhRepeater
                    form={form}
                    fieldName="repeter"
                    defaultValues={[{day: '', startTime: '', endTime: ''}]}
                    fieldNames={['startTime', 'endTime']}
                    controlSupport={controlSupport}
                />
            </div>

            <div className="flex justify-start gap-8">
                <div>
                    <label className="">How much notice do you need before a client can book this service?</label>
                    <div className="flex justify-between gap-4">
                        <FhInput/>
                        <FhSelect
                            placeholder={"Day(s)"}
                            options={interval}
                        />
                    </div>
                </div>

                <div>
                    <label className="">How far into the future can clients book this service with you?</label>
                    <div className="flex justify-between gap-4">
                        <FhInput/>
                        <FhSelect
                            placeholder={"Month(s)"}
                            options={interval}
                        />
                    </div>
                </div>
            </div>

            <div className="w-2/6">
                <FhInput type="number" label="How many clients can you serve per time slot?"/>
            </div>

            <div className="flex justify-between gap-8 w-2/6">
                <div className="flex gap-2 items-center">
                    <FhInput type="number"/>
                    <label className="">Hour(s)</label>
                </div>

                <div className="flex gap-2 items-center">
                    <FhInput type="number"/>
                    <label className="">Mins</label>
                </div>
            </div>

            <div className="w-2/6">
                <FhInput type="number" label="Service Price"/>
            </div>

            <div className="w-4/6">
                <FhMedia/>
            </div>

            <div className="flex w-3/6 gap-4">
                <FhButton label="Save Draft"/>
                <FhButton label="Publish"/>
            </div>

        </div>
    );
}