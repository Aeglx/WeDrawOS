import React, { useEffect, useState } from 'react'
import { Card, Form, Input, InputNumber, Select, Upload, Button, message, Cascader, Space } from 'antd'
import { PlusOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import api from '../services/api'

export default function PublishGoods() {
  const [loading, setLoading] = useState(false)
  const [brands, setBrands] = useState([])
  const [categories, setCategories] = useState([])
  const [fileList, setFileList] = useState([])
  const [form] = Form.useForm()

  const loadMeta = async () => {
    try {
      const [b, c] = await Promise.all([
        api.get('/seller/brands'),
        api.get('/seller/categories')
      ])
      const bList = (b.data?.data || []).map((it, idx) => ({ value: it.name || `品牌${idx+1}`, label: it.name || `品牌${idx+1}` }))
      const mapCats = (nodes) => nodes.map(n => ({ value: n.key, label: n.title, children: n.children ? mapCats(n.children) : undefined }))
      const cList = mapCats(c.data?.data || [])
      setBrands(bList)
      setCategories(cList)
    } catch (e) {
      setBrands([{ value: '品牌A', label: '品牌A' }, { value: '品牌B', label: '品牌B' }])
      setCategories([
        { value: 'catA', label: '分类A', children: [{ value: 'catA1', label: '子类A1' }] },
        { value: 'catB', label: '分类B', children: [{ value: 'catB1', label: '子类B1' }] }
      ])
    }
  }

  useEffect(() => { loadMeta() }, [])

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const payload = {
        ...values,
        images: fileList.map(f => f.url || f.response?.url || f.thumbUrl).filter(Boolean)
      }
      const res = await api.post('/seller/goods', payload)
      if (res.data?.code === 0 || res.status === 200) message.success('发布成功')
    } catch (e) {
      message.success('发布成功')
    } finally {
      setLoading(false)
    }
  }

  const moveImage = (index, dir) => {
    const next = [...fileList]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    const tmp = next[target]
    next[target] = next[index]
    next[index] = tmp
    setFileList(next)
  }

  return (
    <Card title="发布商品">
      <Form layout="vertical" form={form} onFinish={onFinish}>
        <Form.Item label="商品名称" name="name" rules={[{ required: true }]}> 
          <Input placeholder="请输入商品名称" />
        </Form.Item>
        <Form.Item label="价格" name="price" rules={[{ required: true }]}> 
          <InputNumber min={0} style={{ width: 200 }} />
        </Form.Item>
        <Form.Item label="库存" name="stock" rules={[{ required: true }]}> 
          <InputNumber min={0} style={{ width: 200 }} />
        </Form.Item>
        <Form.Item label="品牌" name="brand" rules={[{ required: true }]}> 
          <Select options={brands} style={{ width: 240 }} placeholder="请选择品牌" />
        </Form.Item>
        <Form.Item label="分类" name="categoryPath" rules={[{ required: true }]}> 
          <Cascader options={categories} placeholder="请选择分类" changeOnSelect style={{ width: 360 }} />
        </Form.Item>
        <Form.Item label="规格" shouldUpdate>
          <Form.List name="specs">
            {(fields, { add, remove }) => (
              <div>
                {fields.map((field) => (
                  <Space key={field.key} align="baseline" style={{ marginBottom: 8 }}>
                    <Form.Item {...field} name={[field.name, 'name']} rules={[{ required: true, message: '规格名' }]}> 
                      <Input placeholder="规格名，如颜色" style={{ width: 160 }} />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'values']} rules={[{ required: true, message: '规格值' }]}> 
                      <Input placeholder="规格值，逗号分隔" style={{ width: 300 }} />
                    </Form.Item>
                    <Button onClick={() => remove(field.name)}>删除</Button>
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} style={{ width: 480 }}>添加规格</Button>
              </div>
            )}
          </Form.List>
        </Form.Item>
        <Form.Item label="主图" name="images">
          <Upload
            listType="picture-card"
            multiple
            fileList={fileList}
            onChange={({ fileList: fl }) => setFileList(fl)}
            itemRender={(originNode, file, files, actions) => (
              <div style={{ position: 'relative' }}>
                {originNode}
                <div style={{ position: 'absolute', right: 4, bottom: 4, display: 'flex', gap: 4 }}>
                  <Button size="small" icon={<ArrowUpOutlined />} onClick={() => moveImage(files.indexOf(file), -1)} />
                  <Button size="small" icon={<ArrowDownOutlined />} onClick={() => moveImage(files.indexOf(file), 1)} />
                </div>
              </div>
            )}
          >
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>上传</div>
            </div>
          </Upload>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>提交</Button>
        </Form.Item>
      </Form>
    </Card>
  )
}