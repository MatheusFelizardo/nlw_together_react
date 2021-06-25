import logoImg from '../assets/images/logo.svg';
import { Button } from '../components/Button';
import {RoomCode} from '../components/RoomCode'
import '../styles/room.scss'

import { useParams } from 'react-router-dom'
import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { database } from '../services/firebase';

type RoomParams = {
    id: string;
}

type FirebaseQuestions = Record<string, {
    author: {
        name: string;
        avatar: string;
    }
    content: string;
    isHighlighted: string;
    isAnswered:string;
}>

type Question = {
    id: string;
    author: {
        name: string;
        avatar: string;
    }
    content: string;
    isHighlighted: string;
    isAnswered:string;
}

export function Room() {
    const {user} = useAuth() 
    const params = useParams<RoomParams>();
    const [newQuestion, setNewQuestion] = useState('')
    const [questions, setQuestions] = useState<Question[]>([])
    const [title,setTitle] = useState('')
    const roomId = params.id

    useEffect(()=> {
        const roomRef = database.ref(`rooms/${roomId}`)

        roomRef.on('value', room => {
            const databaseRoom = room.val()
            const firebaseQuestion: FirebaseQuestions = databaseRoom.questions ?? {}

            const parsedQuestions = Object.entries(firebaseQuestion).map(([key, value])=> {
                return {
                    id: key,
                    content: value.content,
                    author: value.author,
                    isHighlighted: value.isHighlighted,
                    isAnswered: value.isAnswered,
                }
            })

            setQuestions(parsedQuestions)
            setTitle(databaseRoom.title)
        })
    }, [roomId])

    async function handleSendQuestion(e:FormEvent) {
        e.preventDefault();

        if(newQuestion.trim() === "") {
            return
        }

        if(!user) {
           throw new Error("You must be logged in");
        }

        const question = {
            content: newQuestion,
            author: {
                name: user.name,
                avatar: user.avatar
            },
            isHighlighted: false,
            isAnswered: false
        }

        await database.ref(`rooms/${roomId}/questions`).push(question)

        setNewQuestion("")

    }

    return (
        <div id="page-room">
            
            <header>
                <div className="content">
                    <img src={logoImg} alt="Letmeask" />
                    <RoomCode code={roomId}/>
                </div>
            </header>

            <main className="content">
                <div className="room-title">
                    <h1>Sala {title}</h1>
                    { questions.length > 0 && <span>{questions.length} {questions.length > 1 ? 'perguntas' : 'pergunta'}</span> }
                    
                </div>

                <form onSubmit={handleSendQuestion}>
                    <textarea placeholder="O que você quer perguntar?" value={newQuestion} onChange={(e)=>setNewQuestion(e.target.value)}/>

                    <div className="form-footer">
                        { user ? (
                            <div className="user-info">
                                <img src={user.avatar} alt="User avatar" />
                                <span>{user.name}</span>
                            </div>
                        ) 
                        : 
                        (
                            <span>Para enviar sua pergunta, <button>faça seu login</button> </span>
                        ) }
                        
                        <Button type="submit">Enviar pergunta</Button>
                    </div>

                </form>
            </main>
        

        </div>
    )
}