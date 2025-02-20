import { useState } from "react";
import { CustomFieldType, type CustomField } from "@prisma/client";
import { Form, useNavigation } from "@remix-run/react";
import { useAtom } from "jotai";
import { useZorm } from "react-zorm";
import { z } from "zod";
import { updateTitleAtom } from "~/atoms/custom-fields.new";
import { useOrganizationId } from "~/hooks/use-organization-id";
import { isFormProcessing } from "~/utils";
import { FIELD_TYPE_NAME } from "~/utils/custom-fields";
import { zodFieldIsRequired } from "~/utils/zod";
import FormRow from "../forms/form-row";
import Input from "../forms/input";
import OptionBuilder from "../forms/option-builder";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../forms/select";
import { Switch } from "../forms/switch";
import { Button } from "../shared";
import { Spinner } from "../shared/spinner";

export const NewCustomFieldFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  helpText: z
    .string()
    .optional()
    .transform((val) => val || null), // Transforming undefined to fit prismas null constraint
  type: z.nativeEnum(CustomFieldType),
  required: z
    .string()
    .optional()
    .transform((val) => (val === "on" ? true : false)),
  active: z
    .string()
    .optional()
    .transform((val) => (val === "on" ? true : false)),
  organizationId: z.string(),
  options: z.array(z.string()).optional(),
});

/** Pass props of the values to be used as default for the form fields */
interface Props {
  name?: CustomField["name"];
  helpText?: CustomField["helpText"];
  required?: CustomField["required"];
  type?: CustomField["type"];
  active?: CustomField["active"];
  options?: CustomField["options"];
  isEdit?: boolean;
}

const FIELD_TYPE_DESCRIPTION: { [key in CustomFieldType]: string } = {
  TEXT: "A place to store short information for your asset. For instance: Serial numbers, notes or anything you wish. No input validation. Any text is acceptable.",
  OPTION: "A dropdown list of predefined options.",
  BOOLEAN: "A true/false or yes/no value.",
  DATE: "A date picker for selecting a date.",
  MULTILINE_TEXT:
    "A place to store longer, multiline information for your asset. For instance: Descriptions, comments, or detailed notes.",
};

export const CustomFieldForm = ({
  options: opts,
  name,
  helpText,
  required,
  type,
  active,
  isEdit = false,
}: Props) => {
  const navigation = useNavigation();
  const zo = useZorm("NewQuestionWizardScreen", NewCustomFieldFormSchema);
  const disabled = isFormProcessing(navigation.state);

  const [options, setOptions] = useState<Array<string>>(opts || []);
  const [selectedType, setSelectedType] = useState<CustomFieldType>(
    type || "TEXT"
  );

  const [, updateTitle] = useAtom(updateTitleAtom);

  // keeping text field type by default selected
  const organizationId = useOrganizationId();

  return (
    <Form
      ref={zo.ref}
      method="post"
      className="flex w-full flex-col gap-2"
      encType="multipart/form-data"
    >
      <FormRow
        rowLabel={"Name"}
        className="border-b-0 pb-[10px]"
        required={zodFieldIsRequired(NewCustomFieldFormSchema.shape.name)}
      >
        <Input
          label="Name"
          hideLabel
          name={zo.fields.name()}
          disabled={disabled}
          error={zo.errors.name()?.message}
          autoFocus
          onChange={updateTitle}
          className="w-full"
          defaultValue={name || ""}
          placeholder="Choose a field name"
          required={zodFieldIsRequired(NewCustomFieldFormSchema.shape.name)}
        />
      </FormRow>

      <div>
        <label className="lg:hidden">Type</label>
        <FormRow
          rowLabel={"Type"}
          className="border-b-0 pb-[10px] pt-[6px]"
          required={zodFieldIsRequired(NewCustomFieldFormSchema.shape.type)}
        >
          <Select
            name="type"
            defaultValue={selectedType}
            disabled={disabled}
            onValueChange={(val: CustomFieldType) => setSelectedType(val)}
          >
            <SelectTrigger
              disabled={isEdit}
              className="px-3.5 py-3"
              placeholder="Choose a field type"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              position="popper"
              className="w-full min-w-[300px]"
              align="start"
            >
              <div className=" max-h-[320px] overflow-auto">
                {Object.keys(FIELD_TYPE_NAME).map((value) => (
                  <SelectItem value={value} key={value}>
                    <span className="mr-4 text-[14px] text-gray-700">
                      {FIELD_TYPE_NAME[value as CustomFieldType]}
                    </span>
                  </SelectItem>
                ))}
              </div>
            </SelectContent>
          </Select>
          <div className="mt-2 flex-1 grow rounded-xl border px-6 py-5 text-[14px] text-gray-600 ">
            <p>{FIELD_TYPE_DESCRIPTION[selectedType]}</p>
          </div>
        </FormRow>
        {selectedType === "OPTION" ? (
          <>
            <FormRow rowLabel="" className="mt-0 border-b-0 pt-0">
              <OptionBuilder
                onRemove={(i: number) => {
                  options.splice(i, 1);
                  setOptions([...options]);
                }}
                options={options}
                onAdd={(o: string) => setOptions([...options, o])}
              />
              {options.map((op, i) => (
                <input
                  key={i}
                  type="hidden"
                  name={zo.fields.options(i)()}
                  value={op}
                />
              ))}
            </FormRow>
          </>
        ) : null}
      </div>
      <FormRow rowLabel="" className="border-b-0 pt-2">
        <div className="flex items-center gap-3">
          <Switch
            name={zo.fields.required()}
            disabled={disabled}
            defaultChecked={required}
          />
          <label className="text-base font-medium text-gray-700">
            Required
          </label>
        </div>
      </FormRow>

      <FormRow rowLabel="" className="border-b-0 pt-2">
        <div className="flex items-center gap-3">
          <Switch
            name={zo.fields.active()}
            disabled={disabled}
            defaultChecked={active === undefined || active}
          />
          <div>
            <label className="text-base font-medium text-gray-700">
              Active
            </label>
            <p className="text-[14px] text-gray-600">
              Deactivating a field will no longer show it on the asset form and
              page
            </p>
          </div>
        </div>
      </FormRow>

      <div>
        <FormRow
          rowLabel="Help Text"
          subHeading={
            <p>
              This text will function as a help text that is visible when
              filling the field
            </p>
          }
          required={zodFieldIsRequired(NewCustomFieldFormSchema.shape.helpText)}
        >
          <Input
            inputType="textarea"
            label="Help Text"
            name={zo.fields.helpText()}
            defaultValue={helpText || ""}
            placeholder="Add a help text for your custom field."
            disabled={disabled}
            data-test-id="fieldHelpText"
            className="w-full"
            hideLabel
            required={zodFieldIsRequired(
              NewCustomFieldFormSchema.shape.helpText
            )}
          />
        </FormRow>
      </div>

      {/* hidden field organization Id to get the organization Id on each form submission to link custom fields and its value is loaded using useOrganizationId hook */}
      <input
        type="hidden"
        name={zo.fields.organizationId()}
        value={organizationId}
      />

      <div className="text-right">
        <Button type="submit" disabled={disabled}>
          {disabled ? <Spinner /> : "Save"}
        </Button>
      </div>
    </Form>
  );
};
