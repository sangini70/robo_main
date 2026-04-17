import React from 'react';
import AdminEditor from '../../components/Admin/Editor';

export default function AdminNew() {
  return <AdminEditor isNew />;
}

export function AdminEdit() {
  return <AdminEditor isNew={false} />;
}
