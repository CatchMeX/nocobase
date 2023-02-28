import React, { useState } from 'react';
import { Input, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import { DynamicComponent } from './DynamicComponent';
const { Option } = Select;
import { Variable } from '.././../schema-component';
import { useVariableOptions } from './Variables';

export const ValueDynamicComponent = (props) => {
  const { fieldValue, schema, setValue, collectionName } = props;
  const [mode, setMode] = useState(fieldValue?.mode || 'constant');
  const { t } = useTranslation();
  const scope = useVariableOptions(collectionName);
  return (
    <Input.Group compact>
      <Select
        value={mode}
        style={{ width: 150 }}
        onChange={(value) => {
          setMode(value);
          setValue({
            mode: value,
          });
        }}
      >
        <Option value="constant">{t('Constant value')}</Option>
        <Option value="express">{t('Expression')}</Option>
        <Option value="empty">{t('Empty')}</Option>
      </Select>
      {mode === 'constant' ? (
        <div style={{ minWidth: 150, maxWidth: 430 }}>
          {React.createElement(DynamicComponent, {
            value: fieldValue?.value || fieldValue,
            schema,
            onChange(value) {
              setValue({
                mode,
                value,
              });
            },
          })}
        </div>
      ) : mode === 'express' ? (
        <div style={{ minWidth: 150, maxWidth: 430 }}>
          <Variable.TextArea
            value={fieldValue?.value}
            onChange={(value) => {
              const result = value.replaceAll(`${collectionName}.`, '').replaceAll('$system.', '').trim();
              setValue({
                mode,
                value,
                result,
              });
            }}
            scope={scope}
            style={{ minWidth: 460, marginRight: 15 }}
          />
        </div>
      ) : null}
    </Input.Group>
  );
};