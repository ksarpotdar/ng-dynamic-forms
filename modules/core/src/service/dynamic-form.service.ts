import { Injectable } from "@angular/core";
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { DynamicFormControlModel } from "../model/dynamic-form-control.model";
import { DynamicFormValueControlModel, DynamicFormControlValue } from "../model/dynamic-form-value-control.model";
import {
    DynamicFormArrayModel,
    DYNAMIC_FORM_CONTROL_TYPE_ARRAY,
    DynamicFormArrayGroupModel
} from "../model/form-array/dynamic-form-array.model";
import { DYNAMIC_FORM_CONTROL_TYPE_GROUP, DynamicFormGroupModel } from "../model/form-group/dynamic-form-group.model";
import {
    DYNAMIC_FORM_CONTROL_TYPE_CHECKBOX_GROUP,
    DynamicCheckboxGroupModel
} from "../model/checkbox/dynamic-checkbox-group.model";
import { DYNAMIC_FORM_CONTROL_TYPE_CHECKBOX, DynamicCheckboxModel } from "../model/checkbox/dynamic-checkbox.model";
import {
    DYNAMIC_FORM_CONTROL_TYPE_DATEPICKER,
    DynamicDatePickerModel
} from "../model/datepicker/dynamic-datepicker.model";
import { DYNAMIC_FORM_CONTROL_TYPE_EDITOR, DynamicEditorModel } from "../model/editor/dynamic-editor.model";
import {
    DYNAMIC_FORM_CONTROL_TYPE_FILE_UPLOAD,
    DynamicFileUploadModel
} from "../model/file-upload/dynamic-file-upload.model";
import { DYNAMIC_FORM_CONTROL_TYPE_INPUT, DynamicInputModel } from "../model/input/dynamic-input.model";
import {
    DYNAMIC_FORM_CONTROL_TYPE_RADIO_GROUP,
    DynamicRadioGroupModel
} from "../model/radio/dynamic-radio-group.model";
import { DYNAMIC_FORM_CONTROL_TYPE_SELECT, DynamicSelectModel } from "../model/select/dynamic-select.model";
import { DYNAMIC_FORM_CONTROL_TYPE_SLIDER, DynamicSliderModel } from "../model/slider/dynamic-slider.model";
import { DYNAMIC_FORM_CONTROL_TYPE_SWITCH, DynamicSwitchModel } from "../model/switch/dynamic-switch.model";
import { DYNAMIC_FORM_CONTROL_TYPE_TEXTAREA, DynamicTextAreaModel } from "../model/textarea/dynamic-textarea.model";
import {
    DYNAMIC_FORM_CONTROL_TYPE_TIMEPICKER,
    DynamicTimePickerModel
} from "../model/timepicker/dynamic-timepicker.model";
import { Utils } from "../utils/core.utils";
import { DynamicFormValidationService } from "./dynamic-form-validation.service";

@Injectable()
export class DynamicFormService {

    constructor(private formBuilder: FormBuilder, private validationService: DynamicFormValidationService) {}


    createFormArray(model: DynamicFormArrayModel): FormArray {

        let formArray = [];

        for (let i = 0; i < model.size; i += 1) {
            formArray.push(this.createFormGroup(model.get(i).group));
        }

        return this.formBuilder.array(
            formArray,
            this.validationService.getValidators(model.validator)[0] || null,
            this.validationService.getAsyncValidators(model.asyncValidator)[0] || null
        );
    }


    createFormGroup(group: DynamicFormControlModel[], groupExtra: { [key: string]: any } | null = null): FormGroup {

        let formGroup: { [id: string]: AbstractControl; } = {};

        group.forEach(model => {

            if (model.type === DYNAMIC_FORM_CONTROL_TYPE_ARRAY) {

                let arrayModel = model as DynamicFormArrayModel;

                formGroup[model.id] = this.createFormArray(arrayModel);

            } else if (model.type === DYNAMIC_FORM_CONTROL_TYPE_GROUP || model.type === DYNAMIC_FORM_CONTROL_TYPE_CHECKBOX_GROUP) {

                let groupModel = model as DynamicFormGroupModel,
                    groupExtra = {
                        validator: this.validationService.getValidators(groupModel.validator)[0] || null,
                        asyncValidator: this.validationService.getAsyncValidators(groupModel.asyncValidator)[0] || null
                    };

                formGroup[model.id] = this.createFormGroup(groupModel.group, groupExtra);

            } else {

                let controlModel = model as DynamicFormValueControlModel<DynamicFormControlValue>;

                formGroup[controlModel.id] = new FormControl(
                    {
                        value: controlModel.value,
                        disabled: controlModel.disabled
                    },
                    Validators.compose(this.validationService.getValidators(controlModel.validators)),
                    Validators.composeAsync(this.validationService.getAsyncValidators(controlModel.asyncValidators))
                );
            }
        });

        return this.formBuilder.group(formGroup, groupExtra);
    }


    addFormGroupControl(formGroup: FormGroup,
                        groupModel: DynamicFormControlModel[] | DynamicFormGroupModel,
                        ...controlModels: DynamicFormControlModel[]): void {

        if (groupModel instanceof DynamicFormGroupModel) {

            this.insertFormGroupControl(groupModel.size(), formGroup, groupModel, ...controlModels);

        } else {

            let formModel = groupModel as DynamicFormControlModel[];
            this.insertFormGroupControl(formModel.length, formGroup, formModel, ...controlModels);
        }
    }


    moveFormGroupControl(index: number,
                         step: number,
                         groupModel: DynamicFormControlModel[] | DynamicFormGroupModel): void {

        if (groupModel instanceof DynamicFormGroupModel) {

            groupModel.move(index, step);

        } else {

            let formModel = groupModel as DynamicFormControlModel[];
            formModel.splice(index + step, 0, ...formModel.splice(index, 1));
        }
    }


    insertFormGroupControl(index: number,
                           formGroup: FormGroup,
                           groupModel: DynamicFormControlModel[] | DynamicFormGroupModel,
                           ...controlModels: DynamicFormControlModel[]): void {

        let controls = this.createFormGroup(controlModels).controls;

        Object.keys(controls).forEach((controlName, idx) => {

            let controlModel = controlModels[idx];

            if (groupModel instanceof DynamicFormGroupModel) {
                groupModel.insert(index, controlModel);

            } else {
                (groupModel as DynamicFormControlModel[]).splice(index, 0, controlModel);
            }

            formGroup.addControl(controlName, controls[controlName]);
        });
    }


    removeFormGroupControl(index: number,
                           formGroup: FormGroup,
                           groupModel: DynamicFormControlModel[] | DynamicFormGroupModel): void {

        if (groupModel instanceof DynamicFormGroupModel) {

            formGroup.removeControl(groupModel.get(index).id);
            groupModel.remove(index);

        } else {

            formGroup.removeControl(groupModel[index].id);
            (groupModel as DynamicFormControlModel[]).splice(index, 1);
        }
    }


    addFormArrayGroup(formArray: FormArray, model: DynamicFormArrayModel): void {

        formArray.push(this.createFormGroup(model.addGroup().group));
    }


    insertFormArrayGroup(index: number, formArray: FormArray, model: DynamicFormArrayModel): void {

        formArray.insert(index, this.createFormGroup(model.insertGroup(index).group));
    }


    moveFormArrayGroup(index: number, step: number, formArray: FormArray, model: DynamicFormArrayModel): void {

        let newIndex = index + step,
            moveUp = step >= 0;

        if ((index >= 0 && index < model.size) && (newIndex >= 0 && newIndex < model.size)) {

            let movingGroups: AbstractControl[] = [];

            for (let i = moveUp ? index : newIndex; i <= (moveUp ? newIndex : index); i++) {
                movingGroups.push(formArray.at(i));
            }

            movingGroups.forEach((formControl, idx) => {

                let position;

                if (moveUp) {
                    position = idx === 0 ? newIndex : index + idx - 1;

                } else {
                    position = idx === movingGroups.length - 1 ? newIndex : newIndex + idx + 1;
                }

                formArray.setControl(position, formControl);
            });

            model.moveGroup(index, step);

        } else {
            throw new Error(`form array group cannot be moved due to index or new index being out of bounds`);
        }
    }


    removeFormArrayGroup(index: number, formArray: FormArray, model: DynamicFormArrayModel): void {

        formArray.removeAt(index);
        model.removeGroup(index);
    }


    clearFormArray(formArray: FormArray, model: DynamicFormArrayModel): void {

        while (formArray.length > 0) {
            this.removeFormArrayGroup(0, formArray, model);
        }
    }


    findById(id: string, groupModel: DynamicFormControlModel[]): DynamicFormControlModel | null {

        let result = null,
            findByIdFn = (id: string, groupModel: DynamicFormControlModel[]): void => {

                for (let controlModel of groupModel) {

                    if (controlModel.id === id) {
                        result = controlModel;
                        break;
                    }

                    if (controlModel instanceof DynamicFormGroupModel) {
                        findByIdFn(id, (controlModel as DynamicFormGroupModel).group);
                    }
                }
            };

        findByIdFn(id, groupModel);

        return result;
    }


    fromJSON(json: string | Object[]): DynamicFormControlModel[] | never {

        let raw = Utils.isString(json) ? JSON.parse(json as string, Utils.parseJSONReviver) : json,
            group: DynamicFormControlModel[] = [];

        raw.forEach((model: any) => {

            switch (model.type) {

                case DYNAMIC_FORM_CONTROL_TYPE_ARRAY:
                    (model as DynamicFormArrayModel).groups.forEach((groupModel: DynamicFormArrayGroupModel) => {
                        groupModel.group = this.fromJSON(groupModel.group) as DynamicFormControlModel[];
                    });
                    model.createGroup = () => this.fromJSON(model.origin);
                    group.push(new DynamicFormArrayModel(model, model.cls));
                    break;

                case DYNAMIC_FORM_CONTROL_TYPE_CHECKBOX:
                    group.push(new DynamicCheckboxModel(model, model.cls));
                    break;

                case DYNAMIC_FORM_CONTROL_TYPE_CHECKBOX_GROUP:
                    model.group = this.fromJSON(model.group) as DynamicCheckboxModel[];
                    group.push(new DynamicCheckboxGroupModel(model, model.cls));
                    break;

                case DYNAMIC_FORM_CONTROL_TYPE_DATEPICKER:
                    group.push(new DynamicDatePickerModel(model, model.cls));
                    break;

                case DYNAMIC_FORM_CONTROL_TYPE_EDITOR:
                    group.push(new DynamicEditorModel(model, model.cls));
                    break;

                case DYNAMIC_FORM_CONTROL_TYPE_FILE_UPLOAD:
                    model.value = null;
                    group.push(new DynamicFileUploadModel(model, model.cls));
                    break;

                case DYNAMIC_FORM_CONTROL_TYPE_GROUP:
                    model.group = this.fromJSON(model.group);
                    group.push(new DynamicFormGroupModel(model, model.cls));
                    break;

                case DYNAMIC_FORM_CONTROL_TYPE_INPUT:
                    if (model["mask"] !== null) { model["mask"] = Utils.maskFromString(model["mask"]); }
                    group.push(new DynamicInputModel(model, model.cls));
                    break;

                case DYNAMIC_FORM_CONTROL_TYPE_RADIO_GROUP:
                    group.push(new DynamicRadioGroupModel(model, model.cls));
                    break;

                case DYNAMIC_FORM_CONTROL_TYPE_SELECT:
                    group.push(new DynamicSelectModel(model, model.cls));
                    break;

                case DYNAMIC_FORM_CONTROL_TYPE_SLIDER:
                    group.push(new DynamicSliderModel(model, model.cls));
                    break;

                case DYNAMIC_FORM_CONTROL_TYPE_SWITCH:
                    group.push(new DynamicSwitchModel(model, model.cls));
                    break;

                case DYNAMIC_FORM_CONTROL_TYPE_TEXTAREA:
                    group.push(new DynamicTextAreaModel(model, model.cls));
                    break;

                case DYNAMIC_FORM_CONTROL_TYPE_TIMEPICKER:
                    group.push(new DynamicTimePickerModel(model, model.cls));
                    break;

                default:
                    throw new Error(`unknown form control model type defined on JSON object with id "${model.id}"`);
            }
        });

        return group;
    }
}