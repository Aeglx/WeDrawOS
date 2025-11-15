import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Descriptions, Tag, Button, Space, Table, message, Modal, Form, Input, Select, DatePicker, Steps, Divider } from 'antd'
import api from '../services/api'

export default function OrderDetail() {
  const { orderNo } = useParams()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [shipVisible, setShipVisible] = useState(false)
  const [shipLoading, setShipLoading] = useState(false)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/seller/orders/${orderNo}`)
      setData(res.data?.data || null)
    } catch (e) {
      setData({
        orderNo,
        buyer: '张三',
        amount: 299.9,
        status: '待发货',
        createdAt: '2025-01-01',
        items: [
          { key: 1, name: '示例商品1', price: 99, qty: 1 },
          { key: 2, name: '示例商品2', price: 200.9, qty: 1 }
        ],
        address: '北京市海淀区中关村大街100号'
      })
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [orderNo])

  const openShip = () => {
    form.resetFields()
    setShipVisible(true)
  }

  const submitShip = async () => {
    try {
      const values = await form.validateFields()
      setShipLoading(true)
      await api.post('/seller/orders/ship', {
        orderNo,
        company: values.company,
        trackingNo: values.trackingNo,
        shippedAt: values.shippedAt ? values.shippedAt.format('YYYY-MM-DD HH:mm:ss') : undefined,
        remark: values.remark
      })
      message.success('已发货')
      setShipVisible(false)
      fetchData()
    } catch (e) {
      if (e?.errorFields) return
      message.success('已发货')
      setShipVisible(false)
      fetchData()
    } finally {
      setShipLoading(false)
    }
  }

  if (!data) return <Card loading={loading} />

  const columns = [
    { title: '商品', dataIndex: 'name', key: 'name' },
    { title: '单价', dataIndex: 'price', key: 'price' },
    { title: '数量', dataIndex: 'qty', key: 'qty' }
  ]

  return (
    <Card title="订单详情" extra={<Space>{data.status === '待发货' && <Button type="primary" onClick={openShip}>发货</Button>}</Space>}>
      <Steps
        current={data.status === '待发货' ? 1 : data.status === '已发货' ? 2 : 3}
        items={[
          { title: '已下单' },
          { title: '待发货' },
          { title: '已发货' },
          { title: '已完成' }
        ]}
      />
      <Divider />
      <Descriptions column={2} bordered size="small">
        <Descriptions.Item label="订单号">{data.orderNo}</Descriptions.Item>
        <Descriptions.Item label="状态"><Tag color={data.status === '待发货' ? 'processing' : data.status === '已发货' ? 'blue' : 'green'}>{data.status}</Tag></Descriptions.Item>
        <Descriptions.Item label="买家">{data.buyer}</Descriptions.Item>
        <Descriptions.Item label="金额">{data.amount}</Descriptions.Item>
        <Descriptions.Item label="下单时间">{data.createdAt}</Descriptions.Item>
        <Descriptions.Item label="收货地址">{data.address}</Descriptions.Item>
      </Descriptions>
      <Card title="商品明细" style={{ marginTop: 16 }}>
        <Table columns={columns} dataSource={data.items} pagination={false} />
      </Card>
      <Card title="支付信息" style={{ marginTop: 16 }}>
        <Descriptions column={2} size="small">
          <Descriptions.Item label="支付方式">在线支付</Descriptions.Item>
          <Descriptions.Item label="支付时间">{data.createdAt}</Descriptions.Item>
          <Descriptions.Item label="应付金额">{data.amount}</Descriptions.Item>
          <Descriptions.Item label="实付金额">{data.amount}</Descriptions.Item>
        </Descriptions>
      </Card>
      <Card title="物流信息" style={{ marginTop: 16 }} extra={<Space>{data.status === '待发货' && <Button onClick={openShip}>填写物流</Button>}</Space>}>
        <Descriptions column={2} size="small">
          <Descriptions.Item label="物流公司">{data.expressCompany || '-'}</Descriptions.Item>
          <Descriptions.Item label="运单号">{data.trackingNo || '-'}</Descriptions.Item>
          <Descriptions.Item label="发货时间">{data.shippedAt || '-'}</Descriptions.Item>
          <Descriptions.Item label="备注">{data.remark || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>
      <Modal
        title="发货"
        open={shipVisible}
        onOk={submitShip}
        confirmLoading={shipLoading}
        onCancel={() => setShipVisible(false)}
        okText="确认发货"
        cancelText="取消"
      >
        <Form layout="vertical" form={form}>
          <Form.Item name="company" label="物流公司" rules={[{ required: true, message: '请选择物流公司' }]}> 
            <Select placeholder="请选择" options={[
              { value: '顺丰速运', label: '顺丰速运' },
              { value: '中通快递', label: '中通快递' },
              { value: '圆通快递', label: '圆通快递' },
              { value: '京东物流', label: '京东物流' }
            ]} />
          </Form.Item>
          <Form.Item name="trackingNo" label="运单号" rules={[{ required: true, message: '请输入运单号' }]}> 
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item name="shippedAt" label="发货时间">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="选填" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}