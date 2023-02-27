import { useField } from '@formily/react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { BlockProvider, useBlockRequestContext } from './BlockProvider';
import { TableBlockProvider } from './TableBlockProvider';
import { useCollectionManager } from '../collection-manager';

export const GanttBlockContext = createContext<any>({});

const formatData = (data = [], fieldNames, tasks: any[] = [], projectId: any = undefined) => {
  data.forEach((item: any) => {
    if (item.children && item.children.length) {
      tasks.push({
        start: new Date(item[fieldNames.start]),
        end: new Date(item[fieldNames.end]),
        name: item[fieldNames.title],
        id: item.id + '',
        type: 'project',
        progress: item[fieldNames.progress] * 100 || 0,
        hideChildren: true,
        project: projectId,
      });
      formatData(item.children, fieldNames, tasks, item.id + '');
    } else {
      tasks.push({
        start: item[fieldNames.start] ? new Date(item[fieldNames.start]) : undefined,
        end: new Date(item[fieldNames.end] || item[fieldNames.start]),
        name: item[fieldNames.title],
        id: item.id + '',
        type: fieldNames.end ? 'task' : 'milestone',
        progress: item[fieldNames.progress] * 100 || 0,
        project: projectId,
      });
    }
  });
  return tasks;
};
const InternalGanttBlockProvider = (props) => {
  const { fieldNames, timeRange, resource } = props;
  const field = useField();
  const { service } = useBlockRequestContext();
  return (
    <GanttBlockContext.Provider
      value={{
        field,
        service,
        resource,
        fieldNames,
        timeRange,
      }}
    >
      {props.children}
    </GanttBlockContext.Provider>
  );
};

export const GanttBlockProvider = (props) => {
  const { getCollection } = useCollectionManager();
  const collection = getCollection(props.collection);
  return (
    <BlockProvider
      {...props}
      params={{ ...props.params, paginate: false, appends: ['parent'], tree: true, filter: { parentId: null } }}
    >
      <TableBlockProvider
        {...props}
        treeTable={!!collection.tree}
        params={{ ...props.params, paginate: false, appends: ['parent'], tree: true, filter: { parentId: null } }}
      >
        <InternalGanttBlockProvider {...props} />
      </TableBlockProvider>
    </BlockProvider>
  );
};

export const useGanttBlockContext = () => {
  return useContext(GanttBlockContext);
};

export const useGanttBlockProps = () => {
  const ctx = useGanttBlockContext();
  const [tasks, setTasks] = useState<any>([]);
  const tasksRef = React.useRef([]);
  const onExpanderClick = (record: any, hideChildren) => {
    const task = tasksRef.current.find((v: any) => v.id === record.id + '');
    const cTasks = tasksRef.current.map((t: any) => (t.id === task.id ? { ...task, hideChildren } : t));
    setTasks(cTasks);
    tasksRef.current = cTasks;
  };
  useEffect(() => {
    if (!ctx?.service?.loading) {
      tasksRef.current = formatData(ctx.service.data?.data, ctx.fieldNames);
      setTasks(formatData(ctx.service.data?.data, ctx.fieldNames));
    }
  }, [ctx?.service?.loading]);
  return {
    fieldNames: ctx.fieldNames,
    timeRange: ctx.timeRange,
    onExpanderClick: onExpanderClick,
    tasks: tasks,
  };
};
