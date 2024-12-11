import { router, useLocalSearchParams, Redirect } from "expo-router";
import { View, Alert, Modal } from "react-native";

import { api } from "@/services/api";
import { useEffect, useState } from "react";

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

    const params = useLocalSearchParams<{ id: string }>()

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

    function handleOpenCamera() {
        try {
            setIsVisibleModal(true)
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        fetchMarket()
    }, [params.id])

    if (isLoading) {
        return <Loading />
    }

    if (!data) {
        return <Redirect href="/home" />
    }

    return <View style={{ flex: 1 }}>
        <Cover uri={data.cover} />
        <Details data={data} />
        {coupon && <Coupon code={coupon} />}

        <View style={{ padding: 32 }}>
            <Button onPress={handleOpenCamera}>
                <Button.Title>Ler QR Code</Button.Title>
            </Button>
        </View>

        <Modal style={{ flex: 1 }} visible={isVisibleModal}>
            <View style={{ flex: 1, justifyContent: "center" }}>
                <Button onPress={() => setIsVisibleModal(false)}>
                    <Button.Title>Voltar</Button.Title>
                </Button>
            </View>
        </Modal>
    </View>
}