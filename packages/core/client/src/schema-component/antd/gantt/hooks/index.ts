import { useField, useFieldSchema, useForm } from '@formily/react';
import { message, Modal } from 'antd';
import parse from 'json-templates';
import { cloneDeep } from 'lodash';
import get from 'lodash/get';
import omit from 'lodash/omit';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
// import { useFormBlockContext, useTableBlockContext } from '../..';
// import { useAPIClient } from '../../api-client';
import { useCollection } from '../../../../collection-manager';
import { useRecord } from '../../../../record-provider';
import { useActionContext, useCompile } from '../../../../schema-component';
// import { BulkEditFormItemValueType } from '../../schema-initializer/components';
import { useCurrentUserContext } from '../../../../user';
import { useBlockRequestContext, useFilterByTk } from '../../../../block-provider/BlockProvider';
import { getFormValues, isURL } from '../../../../block-provider/hooks';
import { useGanttBlockContext } from '../../../../block-provider/GanttBlockProvider';
// import { TableFieldResource } from '../TableFieldProvider';

export const useCreateActionProps = () => {
  const form = useForm();
  const { field, resource, __parent } = useBlockRequestContext();
  const { visible, setVisible } = useActionContext();
  const ctx = useGanttBlockContext();
  const history = useHistory();
  const { t } = useTranslation();
  const actionSchema = useFieldSchema();
  const actionField = useField();
  const { fields, getField } = useCollection();
  const compile = useCompile();
  const filterByTk = useFilterByTk();
  const currentRecord = useRecord();
  const currentUserContext = useCurrentUserContext();
  const currentUser = currentUserContext?.data?.data;
  return {
    async onClick() {
      const fieldNames = fields.map((field) => field.name);
      const {
        assignedValues: originalAssignedValues = {},
        onSuccess,
        overwriteValues,
        skipValidator,
      } = actionSchema?.['x-action-settings'] ?? {};
      const assignedValues = parse(originalAssignedValues)({ currentTime: new Date(), currentRecord, currentUser });
      if (!skipValidator) {
        await form.submit();
      }
      const values = getFormValues(filterByTk, field, form, fieldNames, getField, resource);
      actionField.data = field.data || {};
      actionField.data.loading = true;
      try {
        await resource.create({
          values: {
            ...values,
            ...overwriteValues,
            ...assignedValues,
          },
        });
        actionField.data.loading = false;
        __parent?.service?.refresh?.();
        setVisible?.(false);
        if (!onSuccess?.successMessage) {
          return;
        }
        if (onSuccess?.manualClose) {
          Modal.success({
            title: compile(onSuccess?.successMessage),
            onOk: async () => {
              await form.reset();
              if (onSuccess?.redirecting && onSuccess?.redirectTo) {
                if (isURL(onSuccess.redirectTo)) {
                  window.location.href = onSuccess.redirectTo;
                } else {
                  history.push(onSuccess.redirectTo);
                }
              }
            },
          });
        } else {
          message.success(compile(onSuccess?.successMessage));
        }
        ctx.service?.refresh();
      } catch (error) {
        actionField.data.loading = false;
      }
    },
  };
};
