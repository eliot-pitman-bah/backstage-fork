/*
 * Copyright 2026 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {
  createContext,
  SetStateAction,
  Dispatch,
  useState,
  useContext,
  PropsWithChildren,
} from 'react';
import { JsonObject } from '@backstage/types';

/**
 * The contents of the `FormContext`
 */
type FormContextContents = {
  formData: JsonObject | undefined;
  setFormData: Dispatch<SetStateAction<JsonObject | undefined>>;
};

/**
 * The context to hold the Scaffolder form data.
 */
const FormContext = createContext<FormContextContents | undefined>(undefined);

/**
 * The Context Provider that holds the state for the Scaffolder form data.
 * @public
 */
export const FormContextProvider = (
  props: PropsWithChildren<{ initialFormData?: JsonObject }>,
) => {
  const { initialFormData } = props;
  const [formData, setFormData] = useState<JsonObject | undefined>(
    initialFormData,
  );

  return (
    <FormContext.Provider value={{ formData, setFormData }}>
      {props.children}
    </FormContext.Provider>
  );
};

/**
 * The return type from the `useTemplateFormData` hook.
 * @public
 */
export interface ScaffolderUseTemplateFormData {
  setFormData: (input: JsonObject) => void;
  formData: JsonObject | undefined;
}

/**
 * Hook to access the form context to be able to read and update
 * the Scaffolder form data.
 * @public
 */
export const useTemplateFormData = (): ScaffolderUseTemplateFormData => {
  const value = useContext(FormContext);

  if (!value) {
    throw new Error(
      'useTemplateFormData must be used within a FormContextProvider',
    );
  }

  const { setFormData: updateFormData, formData } = value;

  const setFormData = (input: JsonObject) => {
    updateFormData(input);
  };

  return { setFormData, formData };
};
