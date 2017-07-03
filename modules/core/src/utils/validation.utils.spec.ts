import { ValidationUtils } from "./validation.utils";
import { FormControl } from "@angular/forms";
import { DynamicFormControlModel } from "../model/dynamic-form-control.model";
import { DynamicInputModel } from "../model/input/dynamic-input.model";

describe("Validation Utils test suite", () => {

    it("should detect a validator configuration correctly", () => {

        let testConfig1: any = {name: "test"},
            testConfig2: any = {args: null},
            testConfig3: any = {name: "test", args: null},
            testConfig4 = null;

        expect(ValidationUtils.isValidatorConfig(testConfig1)).toBe(false);
        expect(ValidationUtils.isValidatorConfig(testConfig2)).toBe(false);
        expect(ValidationUtils.isValidatorConfig(testConfig3)).toBe(true);
        expect(ValidationUtils.isValidatorConfig(testConfig4)).toBe(false);
    });
});