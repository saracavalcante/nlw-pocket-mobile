import { router, useLocalSearchParams, Redirect } from "expo-router";
import { View, Alert, Modal, ScrollView } from "react-native";
import { useCameraPermissions, CameraView } from "expo-camera"

import { api } from "@/services/api";
import { useEffect, useState, useRef } from "react";

import { Loading } from "@/components/loading";
import { Cover } from "@/components/market/cover";
import { Coupon } from "@/components/market/coupon";
import { Details, PropsDetails } from "@/components/market/details";
import { Button } from "@/components/button";

type DataProps = PropsDetails & {
    cover: string
}

export default function Market() {
    const [data, setData] = useState<DataProps>()
    const [coupon, setCoupon] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isVisibleModal, setIsVisibleModal] = useState(false)
    const [couponIsFetching, setCouponIsFetching] = useState(false)

    const params = useLocalSearchParams<{ id: string }>()
    const [_, requestPermission] = useCameraPermissions()

    const qrLock = useRef(false)

    async function fetchMarket() {
        try {
            const { data } = await api.get(`/markets/${params.id}`)
            setData(data)
            setIsLoading(false)
        } catch (error) {
            console.log(error)
            Alert.alert("Erro", "Não foi possivel carregar os dados", [
                {
                    text: "Ok",
                    onPress: () => router.back()
                }
            ])
        }
    }

    async function handleOpenCamera() {
        try {
            const { granted } = await requestPermission()

            if (!granted) {
                return Alert.alert("Câmera", "Permissão necessaria")
            }
            qrLock.current = false
            setIsVisibleModal(true)
        } catch (error) {
            console.log(error)
            Alert.alert("Câmera", "Erro inesperado")
        }
    }

    async function getCoupon(id: string) {
        try {
            setCouponIsFetching(true)
            const { data } = await api.patch(`/coupons/${id}`)
            Alert.alert("Cupom", data.coupon)
            setCoupon(data.coupon)
        } catch (error) {
            console.log(error)
        } finally {
            setCouponIsFetching(false)
        }
    }

    function handleUseCoupon(id: string) {
        setIsVisibleModal(false)

        Alert.alert("Cupom", "Não é possivel reutilizar um cupom resgatado. Deseja realmente resgatar o cupom?",
            [
                { style: "cancel", text: "Não" },
                { text: "Sim", onPress: () => getCoupon(id) }
            ]
        )
    }

    useEffect(() => {
        fetchMarket()
    }, [params.id, coupon])

    if (isLoading) {
        return <Loading />
    }

    if (!data) {
        return <Redirect href="/home" />
    }

    return <View style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
            <Cover uri={data.cover} />
            <Details data={data} />
            {coupon && <Coupon code={coupon} />}

            <View style={{ padding: 32 }}>
                <Button onPress={handleOpenCamera}>
                    <Button.Title>Ler QR Code</Button.Title>
                </Button>
            </View>

            <Modal style={{ flex: 1 }} visible={isVisibleModal}>
                <CameraView
                    style={{ flex: 1 }}
                    facing="back"
                    onBarcodeScanned={({ data }) => {
                        if (data && !qrLock.current) {
                            qrLock.current = true
                            setTimeout(() => handleUseCoupon(data), 500)
                        }
                    }}
                />
                <View style={{ position: "absolute", bottom: 32, left: 32, right: 32 }}>
                    <Button
                        onPress={() => setIsVisibleModal(false)}
                        isLoading={couponIsFetching}
                    >
                        <Button.Title>Voltar</Button.Title>
                    </Button>
                </View>
            </Modal>
        </ScrollView>
    </View>
}